import React from 'react';

interface AppIconProps {
  size?: number | string;
  className?: string;
  showBorder?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({
  size = 40,
  className = '',
  showBorder = true,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-xl bg-[#090d18] ${
        showBorder ? 'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
      >
        <defs>
          <linearGradient id="bgGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a0e1a" />
            <stop offset="50%" stopColor="#04060b" />
            <stop offset="100%" stopColor="#090d18" />
          </linearGradient>
          <linearGradient id="neonBorderReact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="ghostBodyReact" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="boxGradReact" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>
        </defs>

        {/* Outer Background */}
        <rect x="0" y="0" width="512" height="512" fill="url(#bgGradReact)" />

        {/* Neon Glow Frame */}
        <rect
          x="24"
          y="24"
          width="464"
          height="464"
          rx="76"
          stroke="url(#neonBorderReact)"
          strokeWidth="8"
          fill="none"
          opacity="0.9"
        />

        {/* Ghost Glow Underlay */}
        <ellipse cx="256" cy="230" rx="120" ry="130" fill="#38bdf8" opacity="0.25" />

        {/* Headphone Arc */}
        <path
          d="M 152 200 A 110 110 0 0 1 360 200"
          stroke="#0f172a"
          strokeWidth="26"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 154 195 A 108 108 0 0 1 358 195"
          stroke="#38bdf8"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />

        {/* Ghost Head & Body */}
        <path
          d="M 170 240 C 170 145, 342 145, 342 240 C 342 280, 365 300, 368 315 C 372 332, 350 325, 335 315 C 315 300, 290 320, 265 305 C 245 295, 225 315, 200 305 C 180 295, 160 325, 144 315 C 138 300, 170 280, 170 240 Z"
          fill="url(#ghostBodyReact)"
        />

        {/* Ghost Face */}
        <ellipse cx="225" cy="205" rx="10" ry="15" fill="#0f172a" />
        <ellipse cx="222" cy="200" rx="3.5" ry="5" fill="#ffffff" />
        <ellipse cx="287" cy="205" rx="10" ry="15" fill="#0f172a" />
        <ellipse cx="284" cy="200" rx="3.5" ry="5" fill="#ffffff" />
        <path d="M 244 228 Q 256 244 268 228 Z" fill="#0f172a" />

        {/* Left Headphone Ear */}
        <g transform="translate(130, 195)">
          <rect x="-10" y="-30" width="30" height="60" rx="15" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <ellipse cx="5" cy="0" rx="6" ry="18" fill="#1e293b" />
          <circle cx="5" cy="0" r="7" stroke="#38bdf8" strokeWidth="2" fill="none" />
        </g>

        {/* Right Headphone Ear */}
        <g transform="translate(362, 195)">
          <rect x="-20" y="-30" width="30" height="60" rx="15" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <ellipse cx="-5" cy="0" rx="6" ry="18" fill="#1e293b" />
          <circle cx="-5" cy="0" r="7" stroke="#38bdf8" strokeWidth="2" fill="none" />
        </g>

        {/* Prompt Cards inside the box */}
        <g transform="translate(145, 275)">
          <rect
            x="25"
            y="0"
            width="170"
            height="110"
            rx="12"
            fill="#0369a1"
            stroke="#38bdf8"
            strokeWidth="2"
            transform="rotate(-6 110 55)"
            opacity="0.6"
          />
          <rect
            x="30"
            y="0"
            width="165"
            height="110"
            rx="12"
            fill="#0284c7"
            stroke="#38bdf8"
            strokeWidth="2"
            transform="rotate(4 110 55)"
            opacity="0.8"
          />
          <rect x="20" y="5" width="180" height="115" rx="12" fill="#0c192c" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="65" cy="42" r="8" fill="#38bdf8" />
          <path d="M 40 95 L 85 45 L 125 80 L 155 55 L 185 95 Z" fill="#0284c7" />
          <path d="M 65 95 L 105 52 L 140 95 Z" fill="#38bdf8" opacity="0.9" />
        </g>

        {/* Front Box */}
        <rect x="90" y="325" width="332" height="120" rx="24" fill="url(#boxGradReact)" stroke="#38bdf8" strokeWidth="4" />
        <rect x="92" y="327" width="328" height="6" rx="3" fill="#38bdf8" opacity="0.7" />

        {/* Texts */}
        <text
          x="256"
          y="386"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="52"
          fill="#ffffff"
          textAnchor="middle"
          letterSpacing="2"
        >
          DAN
        </text>
        <text
          x="256"
          y="420"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="19"
          fill="#38bdf8"
          textAnchor="middle"
          letterSpacing="4"
        >
          IMAGES PROMPTS
        </text>
      </svg>
    </div>
  );
};
