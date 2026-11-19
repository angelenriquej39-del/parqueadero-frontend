import './BrandLogo.css';

export default function BrandLogo({ className = '', style }) {
  return (
    <span className={`brand-logo ${className}`} style={style}>
      <img src="/parking-tracker-logo.webp" alt="Parking Tracker" />
      <span className="brand-logo-eslogan">Tu puesto, siempre te espera.</span>
    </span>
  );
}
