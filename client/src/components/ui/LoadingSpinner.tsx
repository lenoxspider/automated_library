export default function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center h-64 ${className}`}>
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
}
