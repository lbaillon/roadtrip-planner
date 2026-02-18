import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import type { GpxCoordinate, WeatherData } from '@roadtrip/shared'

interface HumidityChartProps {
  coordinates: GpxCoordinate[]
  weather: WeatherData[]
}

interface EnrichedPoint {
  lat: number
  lon: number
  ele?: number | null
  distanceKm: number
  humidity: number
}

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const findNearestWeather = (
  coord: GpxCoordinate,
  weatherPoints: WeatherData[]
): WeatherData | undefined =>
  weatherPoints.reduce((nearest, current) => {
    const distCurrent = haversineDistance(
      coord.lat,
      coord.lon,
      current.lat,
      current.lon
    )
    const distNearest = haversineDistance(
      coord.lat,
      coord.lon,
      nearest.lat,
      nearest.lon
    )
    return distCurrent < distNearest ? current : nearest
  })

export function HumidityChart({ coordinates, weather }: HumidityChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  // Filtrer les points météo qui ont une humidité définie
  const weatherWithHumidity = useMemo(
    () =>
      weather.filter(
        (w): w is WeatherData & { humidity: number } => w.timepoints[0].humidity !== undefined
      ),
    [weather]
  )

  // Construire les points enrichis : distance cumulée + humidité du point météo le plus proche
  const data = useMemo<EnrichedPoint[]>(() => {
    if (coordinates.length === 0 || weatherWithHumidity.length === 0) return []

    let cumulatedDistance = 0

    return coordinates.map((coord, i) => {
      if (i > 0) {
        cumulatedDistance += haversineDistance(
          coordinates[i - 1].lat,
          coordinates[i - 1].lon,
          coord.lat,
          coord.lon
        )
      }

      const nearest = findNearestWeather(coord, weatherWithHumidity)

      return {
        lat: coord.lat,
        lon: coord.lon,
        ele: coord.ele,
        distanceKm: parseFloat(cumulatedDistance.toFixed(2)),
        humidity: nearest?.timepoints[0].humidity ?? 0,
      }
    })
  }, [coordinates, weatherWithHumidity])

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const margin = { top: 24, right: 24, bottom: 52, left: 56 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = 280 - margin.top - margin.bottom

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3
      .select(svgRef.current)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Échelles
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.distanceKm) ?? 0])
      .range([0, width])

    const humidityMin = d3.min(data, (d) => d.humidity) ?? 0
    const humidityMax = d3.max(data, (d) => d.humidity) ?? 100

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, humidityMin - 5), Math.min(100, humidityMax + 5)])
      .range([height, 0])

    // Grille horizontale
    svg
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .attr('stroke', '#e2e8f0')
          .attr('stroke-dasharray', '3,3')
      )

    // Axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat((d) => `${d} km`)
      )
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((g) =>
        g
          .selectAll('.tick text')
          .attr('fill', '#64748b')
          .attr('font-size', '11px')
      )

    svg
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${d}%`)
      )
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((g) =>
        g
          .selectAll('.tick text')
          .attr('fill', '#64748b')
          .attr('font-size', '11px')
      )

    // Labels axes
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 44)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text('Distance (km)')

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -46)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text('Humidité (%)')

    // Dégradé sous la courbe
    const defs = svg.append('defs')

    const gradient = defs
      .append('linearGradient')
      .attr('id', 'humidityGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', height)

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2563eb')
      .attr('stop-opacity', 0.3)

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#2563eb')
      .attr('stop-opacity', 0.02)

    // Zone sous la courbe
    const area = d3
      .area<EnrichedPoint>()
      .x((d) => xScale(d.distanceKm))
      .y0(height)
      .y1((d) => yScale(d.humidity))
      .curve(d3.curveCatmullRom.alpha(0.5))

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'url(#humidityGradient)')
      .attr('d', area)

    // Courbe principale
    const line = d3
      .line<EnrichedPoint>()
      .x((d) => xScale(d.distanceKm))
      .y((d) => yScale(d.humidity))
      .curve(d3.curveCatmullRom.alpha(0.5))

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2)
      .attr('d', line)

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #e2e8f0')
      .style('border-radius', '8px')
      .style('padding', '10px 14px')
      .style('font-size', '12px')
      .style('line-height', '1.6')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.08)')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('transition', 'opacity 0.15s ease')

    // Ligne verticale de survol
    const hoverLine = svg
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3')
      .attr('y1', 0)
      .attr('y2', height)
      .style('opacity', 0)

    // Point de survol
    const hoverDot = svg
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#2563eb')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', 0)

    // Zone de capture des événements souris
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event)
        const distanceAtMouse = xScale.invert(mouseX)

        const nearest = data.reduce((a, b) =>
          Math.abs(a.distanceKm - distanceAtMouse) <
          Math.abs(b.distanceKm - distanceAtMouse)
            ? a
            : b
        )

        const cx = xScale(nearest.distanceKm)
        const cy = yScale(nearest.humidity)

        hoverLine.attr('x1', cx).attr('x2', cx).style('opacity', 1)
        hoverDot.attr('cx', cx).attr('cy', cy).style('opacity', 1)

        tooltip
          .style('opacity', 1)
          .html(
            `<strong style="color:#2563eb">💧 ${nearest.humidity}%</strong><br/>
            📏 ${nearest.distanceKm} km${nearest.ele != null ? `<br/>⛰️ ${Math.round(nearest.ele)} m` : ''}`
          )
          .style('left', `${event.pageX + 14}px`)
          .style('top', `${event.pageY - 48}px`)
      })
      .on('mouseleave', () => {
        hoverLine.style('opacity', 0)
        hoverDot.style('opacity', 0)
        tooltip.style('opacity', 0)
      })

    return () => {
      tooltip.remove()
    }
  }, [data])

  if (weatherWithHumidity.length === 0) return null

  return <svg ref={svgRef} style={{ width: '100%', display: 'block' }} />
}
