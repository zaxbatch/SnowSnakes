import React from 'react';

const Banner = () => {
  return (
    <div className="marquee-container">
      <marquee behavior="scroll" direction="left" scrollamount="5">
        🐍 WELCOME TO SNOWSNAKES — DAD JOKES! 🎨 DOODLES! 📢 COMICS! 🎬 SPREAD DA WORD! 🎮 SUBMIT YOUR OWN GAMES! 🐍 
        ❄️ MAYO & MIRACLE WHIP — THE WHITE TWINS! 🍅 KETCHUP — EVERYONE USES HIM, NOBODY TRUSTS HIM! 🌶️ SALSA — MEXICAN FIESTA! 
        🧅 VIN NEGAR — BOLD BLACK FLAVOR! 🌭 MUSTARD — GERMAN SHARP! 🎮 SUBMIT GAMES AND GET FEATURED!
      </marquee>
    </div>
  );
};

export default Banner;