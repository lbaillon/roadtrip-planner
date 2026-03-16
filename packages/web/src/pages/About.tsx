import BoxTitle from '#web/components/BoxTitle'
import styles from './About.module.css'

export default function About() {
  return (
    <div className={styles.main}>
      <BoxTitle>About</BoxTitle>
      <div className={styles.content}>
        <h3 className={styles.subtilte}>Notre appli</h3>
        <p>
          <strong>Road Planner</strong>, c'est ton copilote pour organiser
          des road trips sans prise de tête.
        </p>
        <p>
          Importe un fichier GPX, et l'appli s'occupe du reste : carte
          interactive, météo prévue sur le trajet, graphiques d'humidité...
          Tu peux aussi personnaliser tes waypoints directement sur la carte, 
          ajouter un arrêt coup de cœur, modifier un point, ou en supprimer un
          puis télécharger ton itinéraire mis à jour.
        </p>
        <p>
          Crée un compte pour retrouver tous tes voyages au même endroit, et
          pars l'esprit tranquille.
        </p>
        <br/>
        <h3 className={styles.subtilte}>L'équipe</h3>
        <p><strong>Rémi</strong> : grand passioné de moto, il organise régulièrement des roadtrips pour lui et ses amis. Le projet est né de sa passion, il joue donc le rôle de Product Owner.</p>
        <p>
          <strong>Laury</strong> : ingénieure reconvertie dans le
          développement web, elle a passé 10 ans en biologie moléculaire avant
          de se lancer dans la tech. Diplômée d'un bootcamp fullstack
          JavaScript en 2025, elle apporte rigueur scientifique et passion pour
          la résolution de problèmes à chaque projet. Road Planner, c'est
          son projet phare — conçu de A à Z avec React, TypeScript, Express et
          SQLite.
        </p>
        <p>Actuellement à la recherche d'un poste, n'hésitez pas à la contacter sur <a href='https://www.linkedin.com/in/laurybaillon/'>LinkedIn</a>.</p>
        <p>
          <strong>Alexandre</strong> : en charge de la partie DevOps du
          projet, il s'occupe de la mise en place de
          l'infrastructure, du déploiement et de la CI/CD. Il veille à ce
          que l'appli tourne sans accroc, de la pipeline GitHub Actions
          jusqu'à la mise en production.
        </p>
      </div>
    </div>
  )
}
