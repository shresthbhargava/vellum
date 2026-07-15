"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const sections = [
  { id: "hero", label: "HERO" },
  { id: "problem", label: "PROBLEM" },
  { id: "how-it-works", label: "HOW IT WORKS" },
  { id: "agents", label: "AGENTS" },
  { id: "live-demo", label: "DEMO" },
  { id: "social-proof", label: "PROOF" },
  { id: "cta", label: "BUILD" },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("hero");
  const [user, setUser] = useState<{ email?: string; name?: string; avatar?: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
          avatar: user.user_metadata?.avatar_url,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0],
          avatar: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-40% 0px -40% 0px",
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-black border-b border-white z-50 font-sans tracking-widest text-[11px] font-bold">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="https://vellum11.netlify.app/" className="flex items-center gap-2">
          <span className="text-white">Vellum</span>
          <span className="text-[#f5a623] font-mono">/</span>
          <span className="text-white">POWERED BY GROQ</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleScroll(sec.id)}
              className={`transition-colors duration-200 hover:text-[#f5a623] text-left uppercase ${
                activeSection === sec.id ? "text-[#f5a623]" : "text-white"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/generate")}
            className="bg-[#f5a623] text-black px-4 py-1.5 hover:bg-white hover:text-black transition-colors duration-200 font-bold border border-[#f5a623]"
          >
            LAUNCH APP
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-8 h-8 rounded-full bg-[#222] border border-[#444] flex items-center justify-center text-white text-xs font-bold hover:border-[#f5a623] transition-colors overflow-hidden"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-10 w-56 bg-[#111] border border-[#333] p-3 z-50">
                  <p className="text-white text-xs font-medium truncate mb-0.5">{user.name}</p>
                  <p className="text-[#888] text-[10px] truncate mb-3">{user.email}</p>
                  <button
                    onClick={signOut}
                    className="w-full text-left text-xs text-[#888] hover:text-white transition-colors py-1"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => (window.location.href = "/sign-in")}
              className="text-white text-[11px] font-bold hover:text-[#f5a623] transition-colors"
            >
              SIGN IN
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}