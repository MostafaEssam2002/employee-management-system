const LoginIllustration = () => (
    <svg className="login-illustration" viewBox="0 0 640 580" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Employee working at a desk">
        <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="stream" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#9fd3ee" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d4efe6" stopOpacity="0.3" />
            </linearGradient>
        </defs>

        {/* background blob */}
        <path d="M20 330C0 190 90 90 230 60C340 36 470 40 560 110C640 175 640 300 600 400C560 500 470 560 330 560C190 560 40 520 20 330Z" fill="#e2f4ee" />
        <ellipse cx="330" cy="260" rx="230" ry="190" fill="url(#glow)" />

        {/* connection arcs */}
        <path d="M335 100 C360 40 430 20 480 40" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.8" />
        <path d="M438 55 C500 70 520 100 545 128" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.8" />

        {/* energy streams */}
        <g fill="none" strokeLinecap="round" strokeWidth="5" stroke="url(#stream)">
            <path d="M285 205 C275 170 305 150 318 125" />
            <path d="M340 205 C335 160 380 140 410 98" />
            <path d="M365 205 C375 165 420 150 438 105" />
            <path d="M410 215 C450 195 480 185 520 175" />
        </g>
        <g fill="none" strokeLinecap="round" strokeWidth="2" stroke="#ffffff" opacity="0.8">
            <path d="M296 205 C288 175 312 160 324 135" />
            <path d="M352 205 C350 165 392 145 420 104" />
        </g>

        {/* avatars */}
        <circle cx="438" cy="55" r="44" fill="#bfe4d6" />
        <path d="M408 98 C412 78 464 78 468 98 C455 106 421 106 408 98Z" fill="#8cc4b0" />
        <circle cx="438" cy="50" r="15" fill="#e9b89a" />
        <path d="M422 44 C424 30 452 28 454 44 C448 38 430 38 422 44Z" fill="#5d6a73" />

        <circle cx="335" cy="100" r="35" fill="#fbd8c0" />
        <path d="M312 128 C316 112 354 112 358 128 C348 135 322 135 312 128Z" fill="#9fb0bd" />
        <circle cx="335" cy="96" r="12" fill="#f0c3a6" />
        <path d="M322 94 C320 78 350 78 348 96 C346 88 326 88 322 94Z" fill="#6b7b86" />

        <circle cx="545" cy="128" r="46" fill="#fbd8c0" />
        <path d="M515 172 C520 150 570 150 575 172 C560 180 530 180 515 172Z" fill="#c9ece2" />
        <circle cx="545" cy="122" r="15" fill="#f0c3a6" />
        <path d="M528 118 C522 90 570 88 566 128 C564 112 548 106 528 118Z" fill="#8a9aa6" />

        {/* chat bubbles */}
        <path d="M212 112 h72 a10 10 0 0 1 10 10 v38 a10 10 0 0 1 -10 10 h-30 l-14 14 v-14 h-28 a10 10 0 0 1 -10 -10 v-38 a10 10 0 0 1 10 -10Z" fill="#fcd9c0" />
        <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
            <path d="M216 130 h62" /><path d="M216 142 h46" />
        </g>
        <path d="M462 225 h95 a12 12 0 0 1 12 12 v42 a12 12 0 0 1 -12 12 h-95 a12 12 0 0 1 -12 -12 v-42 a12 12 0 0 1 12 -12Z" fill="#fcd9c0" />
        <path d="M470 225 l-14 -12 l22 6Z" fill="#fcd9c0" />
        <circle cx="478" cy="248" r="7" fill="#ffffff" />
        <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
            <path d="M492 246 h58" /><path d="M474 264 h78" /><path d="M474 275 h60" />
        </g>

        {/* chair */}
        <path d="M70 310 C60 300 78 292 100 295 L140 300 C150 360 145 410 140 425 C115 430 85 428 70 420 C60 380 62 340 70 310Z" fill="#fbd1b4" />
        <path d="M100 420 L190 440 C205 442 210 455 196 458 L110 450Z" fill="#f8c4a2" />
        <rect x="136" y="455" width="10" height="68" fill="#b8c0bf" />
        <path d="M60 545 H230" stroke="#b8c0bf" strokeWidth="9" strokeLinecap="round" />
        <circle cx="70" cy="552" r="9" fill="#a9b2b1" />
        <circle cx="222" cy="552" r="9" fill="#a9b2b1" />

        {/* person */}
        <path d="M190 388 L335 388 C345 388 348 412 338 424 L196 432Z" fill="#aab6b4" />
        <path d="M300 418 L340 424 C346 460 352 500 356 538 L324 540 C316 500 308 460 300 418Z" fill="#a3aeac" />
        <path d="M318 536 L362 536 C372 540 374 550 366 553 L318 553Z" fill="#7f8c8a" />
        <path d="M120 300 C135 268 190 256 214 276 L238 340 C242 372 256 388 282 394 L276 410 C238 410 205 396 178 372 L164 320Z" fill="#bfe0e0" />
        <path d="M232 332 L332 360 C340 363 338 375 330 375 L244 362Z" fill="#c9e6e6" />
        <circle cx="344" cy="368" r="8" fill="#f2c7aa" />
        <rect x="156" y="226" width="24" height="26" rx="8" fill="#e9b999" />
        <circle cx="172" cy="205" r="30" fill="#f2c7aa" />
        <path d="M142 208 C138 168 196 160 208 192 C212 202 208 214 208 214 C198 192 172 188 152 212Z" fill="#8e9ea0" />

        {/* shelf plant */}
        <path d="M455 372 C440 350 440 320 456 300 C466 320 466 350 455 372Z" fill="#a9d8c6" />
        <path d="M455 372 C470 352 485 335 500 335 C500 355 482 372 455 372Z" fill="#8cc9b3" />
        <path d="M455 372 C440 360 425 355 415 358 C420 372 435 378 455 372Z" fill="#b9e2d2" />
        <path d="M448 372 h32 l-4 32 h-24Z" fill="#f9c7a8" />

        {/* monitor */}
        <g transform="rotate(-5 335 280)">
            <rect x="238" y="212" width="200" height="130" rx="10" fill="#f3fbf8" stroke="#bfe4d6" strokeWidth="3" />
            <rect x="248" y="222" width="180" height="110" rx="6" fill="#e8f6f1" />
            <rect x="248" y="222" width="180" height="14" rx="4" fill="#bfe4d6" />
            <circle cx="258" cy="229" r="2.5" fill="#ffffff" /><circle cx="266" cy="229" r="2.5" fill="#ffffff" /><circle cx="274" cy="229" r="2.5" fill="#ffffff" />
            <rect x="254" y="244" width="56" height="78" rx="4" fill="#d9efe8" />
            <g stroke="#a5d6c6" strokeWidth="3" strokeLinecap="round">
                <path d="M262 256 h26" /><path d="M262 266 h38" /><path d="M262 276 h20" />
            </g>
            <rect x="262" y="290" width="38" height="12" rx="3" fill="#8cc9b3" />
            <circle cx="338" cy="278" r="26" fill="none" stroke="#c9e6e0" strokeWidth="5" />
            <circle cx="338" cy="278" r="16" fill="none" stroke="#e1f2ee" strokeWidth="4" />
            <rect x="366" y="252" width="54" height="34" rx="4" fill="#a5d6c6" />
            <g fill="#ffffff">
                <rect x="376" y="268" width="6" height="12" /><rect x="388" y="262" width="6" height="18" /><rect x="400" y="256" width="6" height="24" />
            </g>
            <g stroke="#bfdcd4" strokeWidth="3" strokeLinecap="round">
                <path d="M366 298 h46" /><path d="M366 308 h38" />
            </g>
            <rect x="256" y="318" width="26" height="6" rx="3" fill="#f3c9a8" /><rect x="286" y="318" width="26" height="6" rx="3" fill="#f3c9a8" />
            <rect x="320" y="340" width="50" height="22" fill="#b6e0d2" />
        </g>

        {/* desk */}
        <rect x="26" y="366" width="510" height="13" rx="6.5" fill="#ffffff" />
        <rect x="46" y="379" width="10" height="176" fill="#a9b2b1" />
        <rect x="46" y="379" width="10" height="16" fill="#8e9998" />
        <rect x="498" y="379" width="10" height="176" fill="#a9b2b1" />
        <rect x="498" y="379" width="10" height="16" fill="#8e9998" />

        {/* floor line */}
        <path d="M2 556 H628" stroke="#9fb0ad" strokeWidth="3" strokeLinecap="round" />
    </svg>
)

export default LoginIllustration
