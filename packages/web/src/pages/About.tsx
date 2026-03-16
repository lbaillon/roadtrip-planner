import BoxTitle from '#web/components/BoxTitle'
import { useState } from 'react'
import alexandreImg from '../assets/alexandre.jpg'
import lauryImg from '../assets/laury.jpg'
import remiImg from '../assets/remi.jpg'
import styles from './About.module.css'

type MemberId = 'remi' | 'laury' | 'alexandre'

const members: {
  id: MemberId
  name: string
  img: string
  bio: React.ReactNode
}[] = [
  {
    id: 'laury',
    name: 'Laury',
    img: lauryImg,
    bio: (
      <>
        <p>
          <strong>Laury</strong> : ingénieure reconvertie dans le développement
          web, elle a passé 10 ans en biologie moléculaire avant de se lancer
          dans la tech. Diplômée d&apos;un bootcamp fullstack JavaScript en
          2025, elle apporte rigueur scientifique et passion pour la résolution
          de problèmes à chaque projet. Road Planner, c&apos;est son projet
          phare — conçu de A à Z avec React, TypeScript, Express et SQLite.
        </p>
        <p>
          Actuellement à la recherche d&apos;un poste, n&apos;hésitez pas à la
          contacter sur{' '}
          <a href="https://www.linkedin.com/in/laurybaillon/">LinkedIn</a>.
        </p>
      </>
    ),
  },
  {
    id: 'remi',
    name: 'Rémi',
    img: remiImg,
    bio: (
      <p>
        <strong>Rémi</strong> : grand passionné de moto, il organise
        régulièrement des roadtrips pour lui et ses amis. Le projet est né de sa
        passion, il joue donc le rôle de Product Owner.
      </p>
    ),
  },
  {
    id: 'alexandre',
    name: 'Alexandre',
    img: alexandreImg,
    bio: (
      <p>
        <strong>Alexandre</strong> : en charge de la partie DevOps du projet, il
        s&apos;occupe de la mise en place de l&apos;infrastructure, du
        déploiement et de la CI/CD. Il veille à ce que l&apos;appli tourne sans
        accroc, de la pipeline GitHub Actions jusqu&apos;à la mise en
        production.
      </p>
    ),
  },
]

export default function About() {
  const [selected, setSelected] = useState<MemberId | null>(null)

  function handleClick(id: MemberId) {
    setSelected((prev) => (prev === id ? null : id))
  }

  return (
    <div className={styles.main}>
      <BoxTitle>About</BoxTitle>
      <div className={styles.content}>
        <h3 className={styles.subtilte}>Notre appli</h3>
        <p>
          <strong>Road Planner</strong>, c&apos;est ton copilote pour organiser
          des road trips sans prise de tête.
        </p>
        <p>
          Importe un fichier GPX, et l&apos;appli s&apos;occupe du reste : carte
          interactive, météo prévue sur le trajet, graphiques
          d&apos;humidité... Tu peux aussi personnaliser tes waypoints
          directement sur la carte, ajouter un arrêt coup de cœur, modifier un
          point, ou en supprimer un puis télécharger ton itinéraire mis à jour.
        </p>
        <p>
          Crée un compte pour retrouver tous tes voyages au même endroit, et
          pars l&apos;esprit tranquille.
        </p>

        <h3 className={styles.subtilte}>L&apos;équipe</h3>
        <p className={styles.teamHint}>Clique sur une photo pour en savoir plus.</p>

        <div className={styles.team}>
          <div className={styles.teamRowCenter}>
            {members.slice(0, 1).map((member) => (
              <div key={member.id} className={styles.memberCard}>
                <button
                  className={`${styles.photoButton} ${selected === member.id ? styles.photoActive : ''}`}
                  onClick={() => handleClick(member.id)}
                  aria-expanded={selected === member.id}
                  aria-label={member.name}
                >
                  <img
                    src={member.img}
                    alt={member.name}
                    className={styles.photo}
                  />
                  <span className={styles.memberName}>{member.name}</span>
                </button>
              </div>
            ))}
          </div>
          <div className={styles.teamRow}>
            {members.slice(1).map((member) => (
              <div key={member.id} className={styles.memberCard}>
                <button
                  className={`${styles.photoButton} ${selected === member.id ? styles.photoActive : ''}`}
                  onClick={() => handleClick(member.id)}
                  aria-expanded={selected === member.id}
                  aria-label={member.name}
                >
                  <img
                    src={member.img}
                    alt={member.name}
                    className={styles.photo}
                  />
                  <span className={styles.memberName}>{member.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className={styles.bio}>
            {members.find((m) => m.id === selected)?.bio}
          </div>
        )}
      </div>
    </div>
  )
}
