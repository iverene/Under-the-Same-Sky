const Moon2D = ({ skyTheme }) => {
  const warm = skyTheme === 'dusk' || skyTheme === 'dawn';
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-[76%] top-[10%] -translate-x-1/2 transition-opacity duration-1000"
    >
      <div
        className={`h-16 w-16 rounded-full sm:h-24 sm:w-24 ${
          warm
            ? 'bg-gradient-to-br from-amber-50 to-orange-200'
            : 'bg-gradient-to-br from-amber-50 to-yellow-100'
        } shadow-[0_0_80px_rgba(255,246,205,0.3),0_0_160px_rgba(255,246,205,0.12)]`}
      />
      <div className="absolute right-3 top-2 h-5 w-5 rounded-full bg-amber-200/30 blur-[2px]" />
      <div className="absolute bottom-3 left-4 h-3 w-3 rounded-full bg-amber-200/20 blur-[1px]" />
    </div>
  );
};

export default Moon2D;
