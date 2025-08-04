import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-black border-t border-emerald-800 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-emerald-400 text-sm">
        {/* Left Links */}
        <div className="flex space-x-6 mb-4 md:mb-0">
          <a href="/about" className="hover:text-emerald-300 transition-colors duration-300">
            About
          </a>
          <a href="/docs" className="hover:text-emerald-300 transition-colors duration-300">
            Docs
          </a>
          <a
            href="https://github.com/suhasamaresh/FsFrontend"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-300 transition-colors duration-300"
          >
            GitHub
          </a>
          <a href="/contact" className="hover:text-emerald-300 transition-colors duration-300">
            Contact
          </a>
        </div>
        {/* Right Social Icons */}
        <div className="flex space-x-6">
          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="hover:text-emerald-300 transition-colors duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-5 h-5"
            >
              <path d="M8.29 20c7.547 0 11.675-6.155 11.675-11.495 0-.175 0-.349-.012-.522A8.18 8.18 0 0 0 22 5.92a8.315 8.315 0 0 1-2.357.635 4.077 4.077 0 0 0 1.804-2.245 8.224 8.224 0 0 1-2.605.977 4.107 4.107 0 0 0-6.993 3.743A11.65 11.65 0 0 1 3.16 4.694a4.07 4.07 0 0 0-.555 2.065 4.106 4.106 0 0 0 1.828 3.42 4.073 4.073 0 0 1-1.86-.508v.05a4.106 4.106 0 0 0 3.292 4.022 4.095 4.095 0 0 1-1.853.07 4.108 4.108 0 0 0 3.834 2.828A8.233 8.233 0 0 1 2 18.407a11.616 11.616 0 0 0 6.29 1.808" />
            </svg>
          </a>
          <a
            href="https://discord.gg/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            className="hover:text-emerald-300 transition-colors duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-5 h-5"
            >
              <path d="M20.317 4.3698A19.7913 19.7913 0 0 0 16.168 3 14.4796 14.4796 0 0 0 14.5 2.5a14.55 14.55 0 0 0-2.1.05 19.7363 19.7363 0 0 0-4.675 1.37 14.9321 14.9321 0 0 0-5.39 3.846c-3.292 3.509-3.242 9.2 1.522 13.197A19.499 19.499 0 0 0 5.5 18.125a14.3248 14.3248 0 0 1-3.75-1.75c.3-.3.55-.55.792-.792a6.0883 6.0883 0 0 0 4.775 2.3c.5 0 1-.05 1.5-.15a6.0617 6.0617 0 0 0 1.628-.85c.425-.25.825-.587 1.175-1 .775.425 1.55.65 2.35.75a5.9308 5.9308 0 0 0 2.95-.75 1.9123 1.9123 0 0 1 .45-1 5.9951 5.9951 0 0 0 1.575-2.275zm-11.13 8.8a1.63 1.63 0 1 1-2.27-2.27 1.63 1.63 0 0 1 2.27 2.27Zm6.45 0a1.63 1.63 0 1 1-2.27-2.27 1.63 1.63 0 0 1 2.27 2.27Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
