export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#CBD5E1] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-center text-sm text-[#6B7280]">
          &copy; {new Date().getFullYear()}{' '}
          <span className="font-semibold text-[#111827]">Nile Mart</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
