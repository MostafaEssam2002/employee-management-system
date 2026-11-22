const BrainWiseLogo = ({ size = 64, color = "#7cc9b2" }) => (
    <svg width={size} height={size * 0.82} viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M30 6H12C6 6 3 10 3 15c0 3 1.5 5.500 4 7-3 1.500-5 4.500-5 8 0 5.500 4 9 10 9h16" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M30 4h14c7 0 12 4 12 10 0 4-2.500 7-6 8.500 4.500 1.500 8 5 8 10 0 7-6 11-14 11H30V4Z" fill={color} />
        <path d="M44 14h-6v8h6c2.500 0 4-1.700 4-4s-1.500-4-4-4Zm1 16h-7v9h7c3 0 5-2 5-4.500S48 30 45 30Z" fill="#ffffff" fillOpacity="0.85" />
        <circle cx="14" cy="18" r="3" stroke={color} strokeWidth="2.500" />
        <circle cx="17" cy="30" r="3.500" stroke={color} strokeWidth="2.500" />
    </svg>
)

export default BrainWiseLogo
