const CatMark = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="512" height="512" rx="144" fill="#0B1220" />
    <circle cx="256" cy="284" r="160" fill="url(#catFaceGlow)" fillOpacity="0.98" />
    <path d="M152 188L218 92L246 202L152 188Z" fill="#A7CCFF" fillOpacity="0.95" />
    <path d="M360 188L294 92L266 202L360 188Z" fill="#A7CCFF" fillOpacity="0.95" />
    <path d="M176 268C196 248 224 248 244 268" stroke="#F3F7FF" strokeWidth="22" strokeLinecap="round" />
    <path d="M268 268C288 248 316 248 336 268" stroke="#F3F7FF" strokeWidth="22" strokeLinecap="round" />
    <path d="M240 316C248 328 264 328 272 316" stroke="#DDEBFF" strokeWidth="14" strokeLinecap="round" />
    <path d="M200 352C236 374 276 374 312 352" stroke="#DDEBFF" strokeWidth="16" strokeLinecap="round" />
    <path d="M146 328H66" stroke="#7EA9EB" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.72" />
    <path d="M152 360H82" stroke="#7EA9EB" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.55" />
    <path d="M366 328H446" stroke="#7EA9EB" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.72" />
    <path d="M360 360H430" stroke="#7EA9EB" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.55" />
    <defs>
      <radialGradient
        id="catFaceGlow"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(256 238) rotate(90) scale(220)"
      >
        <stop stopColor="#1E2E4A" />
        <stop offset="1" stopColor="#111B2C" />
      </radialGradient>
    </defs>
  </svg>
)

export default CatMark
