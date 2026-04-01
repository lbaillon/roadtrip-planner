import { NotFoundError, UnauthorizedError } from '#api/errors/app-errors.js'
import { deleteTrack } from './tracks.js'

jest.mock('#api/db/client.js', () => ({
  db: {
    delete: jest.fn(),
  },
}))

jest.mock('#api/services/uploader.js', () => ({
  deleteGpx: jest.fn(),
}))

jest.mock('#api/middlewares/auth.js', () => ({
  authenticate: jest.fn(),
  authorize: jest.fn(() => jest.fn()),
}))

const { db } = jest.requireMock('#api/db/client.js') as {
  db: { delete: jest.Mock }
}
const { deleteGpx } = jest.requireMock('#api/services/uploader.js') as {
  deleteGpx: jest.Mock
}

const mockUser = { userId: 'user-1', email: 'alice@example.com', username: 'Alice', role: 'user' }

describe('deleteTrack', () => {
  it('throws UnauthorizedError when no user is provided', async () => {
    await expect(deleteTrack('track-1', undefined)).rejects.toThrow(
      UnauthorizedError
    )
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('deletes the track and its GPX file when found', async () => {
    const mockTrack = { id: 'track-1', gpxFile: 'gpx-public-id', userId: 'user-1', name: 'My track' }
    const returning = jest.fn().mockResolvedValue([mockTrack])
    const where = jest.fn().mockReturnValue({ returning })
    db.delete.mockReturnValue({ where })

    await deleteTrack('track-1', mockUser)

    expect(db.delete).toHaveBeenCalled()
    expect(deleteGpx).toHaveBeenCalledWith('gpx-public-id')
  })

  it('throws NotFoundError when track does not exist', async () => {
    const returning = jest.fn().mockResolvedValue([])
    const where = jest.fn().mockReturnValue({ returning })
    db.delete.mockReturnValue({ where })

    await expect(deleteTrack('missing-track', mockUser)).rejects.toThrow(
      NotFoundError
    )
    expect(deleteGpx).not.toHaveBeenCalled()
  })
})
