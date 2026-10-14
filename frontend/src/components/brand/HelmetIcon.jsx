export default function HelmetIcon({ className = 'size-8', ...props }) {
  return (
    <img
      src="/images/helmet.png"
      alt="Vutto Helmet"
      className={`object-contain ${className}`}
      {...props}
    />
  );
}
