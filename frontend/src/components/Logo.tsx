export default function Logo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 32 32" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* DeepWeb Signature Mark: Precision D-contour with concentric sonar depth waves */}
      <path d="M4 4h13c7.18 0 13 5.82 13 13s-5.82 13-13 13H4V4zm4 4.5v17H17c4.69 0 8.5-3.81 8.5-8.5S21.69 8.5 17 8.5H8z" />
      <path d="M12 7.5c5.25 0 9.5 4.25 9.5 9.5s-4.25 9.5-9.5 9.5v-2.6c3.81 0 6.9-3.09 6.9-6.9s-3.09-6.9-6.9-6.9V7.5z" />
      <path d="M12 12c2.76 0 5 2.24 5 5s-2.24 5-5 5v-2.4c1.44 0 2.6-1.16 2.6-2.6s-1.16-2.6-2.6-2.6V12z" />
      <circle cx="12" cy="17" r="1.6" />
    </svg>
  );
}
