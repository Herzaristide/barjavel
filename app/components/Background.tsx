/**
 * Décor d'arrière-plan global : formes géométriques en lignes fines, couleur d'accent
 * (repris du dashboard web). Toutes les formes sont ancrées à GAUCHE, du côté
 * du markdown, pour ne pas entrer en conflit avec le graphe (à droite).
 * Fixé derrière tout le contenu (pointer-events-none).
 */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full text-accent"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="currentColor"
      >
        <g vectorEffect="non-scaling-stroke" strokeWidth={1}>
          {/* Cercles concentriques, coin haut-gauche. */}
          <g opacity="0.16">
            <circle cx="120" cy="80" r="120" />
            <circle cx="120" cy="80" r="220" />
            <circle cx="120" cy="80" r="340" />
            <circle cx="120" cy="80" r="470" />
          </g>

          {/* Grand cercle, coin bas-gauche. */}
          <g opacity="0.13">
            <circle cx="80" cy="860" r="170" />
            <circle cx="80" cy="860" r="290" />
          </g>

          {/* Hexagone, milieu-gauche bas. */}
          <polygon opacity="0.2" points="150,560 230,520 310,560 310,650 230,690 150,650" />

          {/* Triangle, bas-gauche. */}
          <polygon opacity="0.18" points="120,780 260,780 190,660" />

          {/* Losange, milieu-gauche. */}
          <polygon opacity="0.15" points="170,320 250,380 170,440 90,380" />

          {/* Lignes diagonales fines, cantonnées à la moitié gauche. */}
          <g opacity="0.09">
            <line x1="0" y1="240" x2="720" y2="110" />
            <line x1="0" y1="720" x2="660" y2="590" />
            <line x1="300" y1="0" x2="560" y2="900" />
          </g>

          {/* Petits accents : carré incliné + cercles pleins discrets. */}
          <rect
            opacity="0.18"
            x="360"
            y="300"
            width="90"
            height="90"
            transform="rotate(20 405 345)"
          />
          <circle opacity="0.22" cx="470" cy="190" r="6" fill="currentColor" />
          <circle opacity="0.18" cx="300" cy="640" r="5" fill="currentColor" />
          <circle opacity="0.18" cx="600" cy="470" r="5" fill="currentColor" />
        </g>
      </svg>
    </div>
  )
}
