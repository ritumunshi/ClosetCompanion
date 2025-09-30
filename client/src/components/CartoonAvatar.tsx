interface CartoonAvatarProps {
  faceImageUrl: string;
  className?: string;
}

export default function CartoonAvatar({ faceImageUrl, className = "" }: CartoonAvatarProps) {
  return (
    <svg
      viewBox="0 0 200 400"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="face-clip">
          <circle cx="100" cy="50" r="35" />
        </clipPath>
      </defs>
      
      {/* Head circle with face photo */}
      <circle cx="100" cy="50" r="40" fill="#FDB8A0" stroke="#333" strokeWidth="2" />
      <image
        href={faceImageUrl}
        x="65"
        y="15"
        width="70"
        height="70"
        clipPath="url(#face-clip)"
        preserveAspectRatio="xMidYMid slice"
      />
      
      {/* Neck */}
      <rect x="88" y="85" width="24" height="20" fill="#FDB8A0" stroke="#333" strokeWidth="2" />
      
      {/* Torso - where tops go */}
      <rect 
        x="60" 
        y="105" 
        width="80" 
        height="100" 
        rx="10"
        fill="#E8E8E8" 
        stroke="#333" 
        strokeWidth="2"
        data-body-part="torso"
      />
      
      {/* Arms */}
      <rect x="40" y="115" width="20" height="80" rx="10" fill="#FDB8A0" stroke="#333" strokeWidth="2" />
      <rect x="140" y="115" width="20" height="80" rx="10" fill="#FDB8A0" stroke="#333" strokeWidth="2" />
      
      {/* Legs - where bottoms go */}
      <rect 
        x="70" 
        y="205" 
        width="25" 
        height="120" 
        rx="5"
        fill="#D3D3D3" 
        stroke="#333" 
        strokeWidth="2"
        data-body-part="legs"
      />
      <rect 
        x="105" 
        y="205" 
        width="25" 
        height="120" 
        rx="5"
        fill="#D3D3D3" 
        stroke="#333" 
        strokeWidth="2"
        data-body-part="legs"
      />
      
      {/* Feet - where shoes go */}
      <ellipse 
        cx="82" 
        cy="335" 
        rx="20" 
        ry="10" 
        fill="#8B8B8B" 
        stroke="#333" 
        strokeWidth="2"
        data-body-part="feet"
      />
      <ellipse 
        cx="118" 
        cy="335" 
        rx="20" 
        ry="10" 
        fill="#8B8B8B" 
        stroke="#333" 
        strokeWidth="2"
        data-body-part="feet"
      />
    </svg>
  );
}
