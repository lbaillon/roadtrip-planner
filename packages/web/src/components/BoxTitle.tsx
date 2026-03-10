import styles from './BoxTitle.module.css'

export default function BoxTitle({children}:{children:string}) {
     return <h3 className={styles.title}>{children}</h3>
}