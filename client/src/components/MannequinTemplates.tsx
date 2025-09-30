interface MannequinProps {
  faceImageUrl: string;
  bodyType: 'male' | 'female' | 'slim' | 'tall';
  className?: string;
}

export default function MannequinTemplate({ faceImageUrl, bodyType, className = "" }: MannequinProps) {
  const templates = {
    male: (
      <g>
        {/* Male proportions: broader shoulders, straight torso */}
        {/* Head */}
        <ellipse cx="100" cy="50" rx="22" ry="25" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Neck */}
        <path d="M 90 70 Q 90 80, 85 85 L 115 85 Q 110 80, 110 70 Z" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Torso */}
        <path 
          d="M 70 90 Q 65 100, 65 120 L 65 180 Q 65 195, 75 200 L 125 200 Q 135 195, 135 180 L 135 120 Q 135 100, 130 90 Z"
          fill="#F5F5F5" 
          stroke="#333" 
          strokeWidth="1.5"
          data-body-part="torso"
        />
        
        {/* Arms */}
        <ellipse cx="58" cy="130" rx="8" ry="45" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        <ellipse cx="142" cy="130" rx="8" ry="45" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Legs */}
        <path 
          d="M 80 200 L 80 310 Q 80 320, 85 325"
          fill="none" 
          stroke="#333" 
          strokeWidth="18"
          strokeLinecap="round"
          data-body-part="legs"
        />
        <path 
          d="M 120 200 L 120 310 Q 120 320, 115 325"
          fill="none" 
          stroke="#333" 
          strokeWidth="18"
          strokeLinecap="round"
          data-body-part="legs"
        />
        
        {/* Feet */}
        <ellipse cx="85" cy="330" rx="18" ry="8" fill="#555" stroke="#333" strokeWidth="1.5" data-body-part="feet" />
        <ellipse cx="115" cy="330" rx="18" ry="8" fill="#555" stroke="#333" strokeWidth="1.5" data-body-part="feet" />
      </g>
    ),
    female: (
      <g>
        {/* Female proportions: narrower shoulders, curved waist */}
        {/* Head */}
        <ellipse cx="100" cy="50" rx="20" ry="24" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Neck */}
        <path d="M 92 70 Q 92 78, 88 82 L 112 82 Q 108 78, 108 70 Z" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Torso with waist curve */}
        <path 
          d="M 75 88 Q 72 95, 70 110 Q 68 140, 75 160 Q 80 180, 80 200 L 120 200 Q 120 180, 125 160 Q 132 140, 130 110 Q 128 95, 125 88 Z"
          fill="#F5F5F5" 
          stroke="#333" 
          strokeWidth="1.5"
          data-body-part="torso"
        />
        
        {/* Arms */}
        <ellipse cx="62" cy="125" rx="7" ry="40" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        <ellipse cx="138" cy="125" rx="7" ry="40" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Legs */}
        <path 
          d="M 85 200 L 85 310 Q 85 318, 88 323"
          fill="none" 
          stroke="#333" 
          strokeWidth="16"
          strokeLinecap="round"
          data-body-part="legs"
        />
        <path 
          d="M 115 200 L 115 310 Q 115 318, 112 323"
          fill="none" 
          stroke="#333" 
          strokeWidth="16"
          strokeLinecap="round"
          data-body-part="legs"
        />
        
        {/* Feet */}
        <ellipse cx="88" cy="328" rx="16" ry="7" fill="#555" stroke="#333" strokeWidth="1.5" data-body-part="feet" />
        <ellipse cx="112" cy="328" rx="16" ry="7" fill="#555" stroke="#333" strokeWidth="1.5" data-body-part="feet" />
      </g>
    ),
    slim: (
      <g>
        {/* Slim proportions: narrow overall, elongated */}
        {/* Head */}
        <ellipse cx="100" cy="50" rx="18" ry="22" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Neck */}
        <rect x="92" y="68" width="16" height="18" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Torso */}
        <path 
          d="M 80 88 Q 78 100, 78 130 L 78 195 Q 78 200, 82 202 L 118 202 Q 122 200, 122 195 L 122 130 Q 122 100, 120 88 Z"
          fill="#F5F5F5" 
          stroke="#333" 
          strokeWidth="1.5"
          data-body-part="torso"
        />
        
        {/* Arms */}
        <ellipse cx="70" cy="130" rx="6" ry="42" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        <ellipse cx="130" cy="130" rx="6" ry="42" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Legs */}
        <path 
          d="M 88 202 L 88 315 Q 88 322, 90 327"
          fill="none" 
          stroke="#333" 
          strokeWidth="14"
          strokeLinecap="round"
          data-body-part="legs"
        />
        <path 
          d="M 112 202 L 112 315 Q 112 322, 110 327"
          fill="none" 
          stroke="#333" 
          strokeWidth="14"
          strokeLinecap="round"
          data-body-part="legs"
        />
        
        {/* Feet */}
        <ellipse cx="90" cy="332" rx="15" ry="6" fill="#555" stroke="#333" strokeWidth="1.5" data-body-part="feet" />
        <ellipse cx="110" cy="332" rx="15" ry="6" fill="#555" stroke="#333" strokeWidth="1.5" data-body-part="feet" />
      </g>
    ),
    tall: (
      <g>
        {/* Tall proportions: extended legs, taller torso */}
        {/* Head */}
        <ellipse cx="100" cy="45" rx="20" ry="23" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Neck */}
        <rect x="90" y="64" width="20" height="20" rx="4" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Torso */}
        <path 
          d="M 72 86 Q 68 95, 68 115 L 68 190 Q 68 200, 76 205 L 124 205 Q 132 200, 132 190 L 132 115 Q 132 95, 128 86 Z"
          fill="#F5F5F5" 
          stroke="#333" 
          strokeWidth="1.5"
          data-body-part="torso"
        />
        
        {/* Arms */}
        <ellipse cx="60" cy="135" rx="7" ry="50" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        <ellipse cx="140" cy="135" rx="7" ry="50" fill="#FDB8A0" stroke="#333" strokeWidth="1.5" />
        
        {/* Legs - extended */}
        <path 
          d="M 83 205 L 83 340 Q 83 348, 86 353"
          fill="none" 
          stroke="#333" 
          strokeWidth="16"
          strokeLinecap="round"
          data-body-part="legs"
        />
        <path 
          d="M 117 205 L 117 340 Q 117 348, 114 353"
          fill="none" 
          stroke="#333" 
          strokeWidth="16"
          strokeLinecap="round"
          data-body-part="legs"
        />
        
        {/* Feet */}
        <ellipse cx="86" cy="358" rx="17" ry="7" fill="#555" stroke="#333" strokeWidth="1.5" data-body-part="feet" />
        <ellipse cx="114" cy="358" rx="17" ry="7" fill="#555" stroke="#333" strokeWidth="1.5" data-body-part="feet" />
      </g>
    ),
  };

  const viewBoxHeight = bodyType === 'tall' ? '370' : '350';

  return (
    <svg
      viewBox={`0 0 200 ${viewBoxHeight}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={`face-clip-${bodyType}`}>
          <circle cx="100" cy="50" r={bodyType === 'slim' ? '16' : bodyType === 'female' ? '18' : '20'} />
        </clipPath>
        {/* Shadow filter for depth */}
        <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Body template */}
      {templates[bodyType]}
      
      {/* Face photo overlay */}
      <circle 
        cx="100" 
        cy="50" 
        r={bodyType === 'slim' ? '18' : bodyType === 'female' ? '20' : '22'} 
        fill="none"
        stroke="#333" 
        strokeWidth="2"
      />
      <image
        href={faceImageUrl}
        x={bodyType === 'slim' ? '84' : bodyType === 'female' ? '80' : '78'}
        y={bodyType === 'slim' ? '34' : bodyType === 'female' ? '30' : '28'}
        width={bodyType === 'slim' ? '32' : bodyType === 'female' ? '40' : '44'}
        height={bodyType === 'slim' ? '32' : bodyType === 'female' ? '40' : '44'}
        clipPath={`url(#face-clip-${bodyType})`}
        preserveAspectRatio="xMidYMid slice"
      />
    </svg>
  );
}
