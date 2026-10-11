

import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {

  Leaf,

  ArrowRight,

  Recycle,

  CalendarDays,

  MapPin,

  BarChart3,

  Truck,

  CheckCircle2,

  Users,

  Menu,
  X,

  Sprout,

  ShieldCheck,

  CircleUserRound,

  LogOut,

  ChevronDown,

  LayoutDashboard,

} from "lucide-react";



const services = [

  {

    icon: CalendarDays,

    title: "Smart Pickup Scheduling",

    description:

      "Schedule waste collection at your convenience with a simple, seamless process.",

    number: "01",

  },

  {

    icon: Recycle,

    title: "Recycling & Segregation",

    description:

      "Encourage responsible waste separation and build a sustainable future.",

    number: "02",

  },

  {

    icon: MapPin,

    title: "Live Collection Tracking",

    description:

      "Stay informed about collection status and track waste pickup progress.",

    number: "03",

  },

  {

    icon: BarChart3,

    title: "Reports & Analytics",

    description:

      "Understand waste trends and measure your community's environmental impact.",

    number: "04",

  },

];



const steps = [

  {

    number: "01",

    title: "Create your account",

    text: "Get started by creating your personal account.",

  },

  {

    number: "02",

    title: "Schedule a pickup",

    text: "Choose your waste type, location and preferred time.",

  },

  {

    number: "03",

    title: "Track your impact",

    text: "Follow your collection and contribute to a cleaner city.",

  },

];



function SectionLabel({ children }) {

  return (

    <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">

      <span className="h-px w-7 bg-emerald-600" />

      {children}

    </p>

  );

}



function readCurrentUser() {

  try {

    const token = localStorage.getItem("ecotrack-token");

    const savedUser = localStorage.getItem("ecotrack-user");



    if (!token || !savedUser) return null;



    const user = JSON.parse(savedUser);



    if (!user || !user.name || !user.role) return null;



    return user;

  } catch {

    return null;

  }

}



export default function Home() {

  const navigate = useNavigate();



  const [currentUser, setCurrentUser] = useState(readCurrentUser);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



  // Keep the navbar synchronized when login details change

  // in another browser tab.

  useEffect(() => {

    function syncLoginState() {

      setCurrentUser(readCurrentUser());

    }



    window.addEventListener("storage", syncLoginState);



    return () => {

      window.removeEventListener("storage", syncLoginState);

    };

  }, []);



  const isAdmin = currentUser?.role === "admin";



  const dashboardPath = isAdmin

    ? "/admin/dashboard"

    : "/user/dashboard";



  function handleLogout() {

    localStorage.removeItem("ecotrack-token");

    localStorage.removeItem("ecotrack-user");

    localStorage.removeItem("ecotrack-reporter-id");



    setCurrentUser(null);

    setProfileMenuOpen(false);



    navigate("/", { replace: true });

  }



  function openDashboard() {

    setProfileMenuOpen(false);

    navigate(dashboardPath);

  }



  return (

    <div className="min-h-screen bg-[#fbfdfb] text-[#102b22]">

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-emerald-950/5 bg-white/95 backdrop-blur-xl">

        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4 lg:px-10">

          {/* BRAND */}

          <Link

            to="/"

            className="flex shrink-0 items-center gap-2.5"

            onClick={() => setProfileMenuOpen(false)}

          >

            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-lg shadow-emerald-900/15">

              <Leaf size={23} />

            </span>



            <span className="text-lg font-extrabold tracking-tight min-[380px]:text-xl sm:text-2xl">

              Eco<span className="text-emerald-700">Track</span>

            </span>

          </Link>



          {/* DESKTOP NAVIGATION */}

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex xl:gap-8">

            <a href="#home" className="text-emerald-800">

              Home

            </a>

            <a

              href="#services"

              className="transition hover:text-emerald-700"

            >

              Services

            </a>

            <a

              href="#how-it-works"

              className="transition hover:text-emerald-700"

            >

              How it works

            </a>

            <a

              href="#impact"

              className="transition hover:text-emerald-700"

            >

              Our impact

            </a>

            <a

              href="#contact"

              className="transition hover:text-emerald-700"

            >

              Contact

            </a>

          </div>



          {/* AUTHENTICATION NAVIGATION */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            {currentUser ? (

              <>

                {/* PROFILE DROPDOWN */}

                <div className="relative">

                  <button

                    type="button"

                    onClick={() =>

                      setProfileMenuOpen((open) => !open)

                    }

                    aria-label="Open profile menu"

                    aria-expanded={profileMenuOpen}

                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-800/15 bg-white p-1 text-left transition hover:border-emerald-700/40 hover:bg-emerald-50 sm:h-auto sm:w-auto sm:max-w-[250px] sm:justify-start sm:gap-3 sm:px-3 sm:py-2"

                  >

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">

                      <CircleUserRound size={21} />

                    </span>



                    <span className="hidden min-w-0 sm:block">

                      <span className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:block">

                        {isAdmin ? "Administrator" : "Welcome back"}

                      </span>



                      <span className="block max-w-[92px] truncate text-sm font-bold text-emerald-950 sm:max-w-[130px]">

                        {currentUser.name}

                      </span>

                    </span>



                    <ChevronDown

                      size={15}

                      className={`hidden shrink-0 text-slate-500 transition sm:block ${

                        profileMenuOpen ? "rotate-180" : ""

                      }`}

                    />

                  </button>



                  {profileMenuOpen && (

                    <>

                      {/* Click outside the dropdown to close it */}

                      <button

                        type="button"

                        aria-label="Close profile menu"

                        onClick={() => setProfileMenuOpen(false)}

                        className="fixed inset-0 z-40 cursor-default"

                      />



                      <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10">

                        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4">

                          <div className="flex items-center gap-3">

                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">

                              <CircleUserRound size={23} />

                            </span>



                            <div className="min-w-0">

                              <p className="truncate text-sm font-bold text-slate-900">

                                {currentUser.name}

                              </p>



                              <p className="mt-1 truncate text-xs text-slate-500">

                                {currentUser.email || "EcoTrack Account"}

                              </p>



                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">

                                {isAdmin ? "Admin Account" : "User Account"}

                              </p>

                            </div>

                          </div>

                        </div>



                        <div className="space-y-1 p-2">

                          <button

                            type="button"

                            onClick={openDashboard}

                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"

                          >

                            <LayoutDashboard size={18} />

                            <span className="flex-1">

                              {isAdmin

                                ? "Admin Dashboard"

                                : "My Dashboard"}

                            </span>

                            <ArrowRight size={15} />

                          </button>



                          <button

                            type="button"

                            onClick={handleLogout}

                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"

                          >

                            <LogOut size={18} />

                            Logout

                          </button>

                        </div>

                      </div>

                    </>

                  )}

                </div>



                {/* QUICK DASHBOARD BUTTON */}

                <Link

                  to={dashboardPath}

                  className="hidden items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-900 xl:inline-flex"

                >

                  Dashboard

                  <ArrowRight size={16} />

                </Link>

              </>

            ) : (

              <>

                {/* LOGGED-OUT NAVBAR */}

                <Link

                  to="/login"

                  className="hidden rounded-xl border border-emerald-800/20 px-3 py-2.5 text-sm font-semibold transition hover:bg-emerald-50 sm:inline-flex sm:px-5"

                >

                  Login

                </Link>



                <Link

                  to="/signup"

                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-900 sm:px-5"

                >

                  <span className="hidden sm:inline">Get Started</span>

                  <span className="sm:hidden">Sign Up</span>

                  <ArrowRight size={16} />

                </Link>

              </>

            )}



            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-home-navigation"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-800/15 bg-white text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700 lg:hidden"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

          </div>

        </nav>

        <div
          id="mobile-home-navigation"
          className={`border-t border-emerald-950/10 bg-white px-4 py-3 shadow-lg lg:hidden ${
            mobileMenuOpen ? "block" : "hidden"
          }`}
        >
          <nav
            className="mx-auto flex w-full max-w-7xl flex-col gap-1"
            aria-label="Mobile navigation"
          >
            {[
              ["Home", "#home"],
              ["Services", "#services"],
              ["How it works", "#how-it-works"],
              ["Our impact", "#impact"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                {label}
              </a>
            ))}

            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={openDashboard}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                >
                  {isAdmin ? "Admin Dashboard" : "My Dashboard"}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:hidden">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center justify-center rounded-xl border border-emerald-800/20 px-3 py-3 text-sm font-semibold text-emerald-900"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-3 py-3 text-sm font-semibold text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>



      {/* HERO */}

      <main>

        <section id="home" className="relative scroll-mt-24">

          <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-lime-100/40 blur-3xl" />



          <div className="relative mx-auto grid w-full max-w-7xl min-w-0 items-center gap-10 px-4 pb-14 pt-10 sm:gap-12 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-2 lg:px-10 lg:pt-24">

            <div className="relative z-10">

              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-800/10 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm">

                <Sprout size={16} />

                SMARTER CITIES. GREENER TOMORROW.

              </div>



              <h1 className="max-w-2xl break-words text-4xl font-black leading-[1.08] tracking-[-0.055em] min-[380px]:text-5xl sm:text-6xl lg:text-7xl">

                Cleaner cities.

                <span className="mt-1 block text-emerald-800">

                  Smarter waste

                </span>

                management.

              </h1>



              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">

                A smarter way to manage waste. Schedule collections, support

                recycling, and help create cleaner, healthier communities with

                one connected platform.

              </p>



              <div className="mt-7 flex flex-col gap-3 min-[430px]:flex-row min-[430px]:flex-wrap min-[430px]:gap-4 sm:mt-9">

                {currentUser ? (

                  <Link

                    to={dashboardPath}

                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 transition hover:-translate-y-1 hover:bg-emerald-900 min-[430px]:w-auto min-[430px]:px-6 min-[430px]:py-4"

                  >

                    Open Dashboard <ArrowRight size={18} />

                  </Link>

                ) : (

                  <Link

                    to="/signup"

                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 transition hover:-translate-y-1 hover:bg-emerald-900 min-[430px]:w-auto min-[430px]:px-6 min-[430px]:py-4"

                  >

                    Get Started <ArrowRight size={18} />

                  </Link>

                )}



                <a

                  href="#how-it-works"

                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition hover:border-emerald-700 hover:bg-emerald-50 min-[430px]:w-auto min-[430px]:px-6 min-[430px]:py-4"

                >

                  Discover How <ArrowRight size={17} />

                </a>

              </div>



              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">

                {["Easy scheduling", "Real-time updates", "Eco-friendly"].map(

                  (item) => (

                    <span key={item} className="flex items-center gap-2">

                      <CheckCircle2 size={17} className="text-emerald-700" />

                      {item}

                    </span>

                  )

                )}

              </div>

            </div>



            {/* HERO VISUAL */}

            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">

              <div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-br from-emerald-200/60 via-lime-100/30 to-emerald-50 blur-xl" />



              <div className="relative overflow-hidden rounded-[2rem] border border-white bg-emerald-100 shadow-2xl shadow-emerald-950/15">

                <img

                  src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=85"

                  alt="Responsible waste sorting and recycling"

                  className="h-[390px] w-full object-cover sm:h-[490px]"

                />



                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-emerald-950/5" />



                <div className="absolute left-5 top-5 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur-md sm:left-7 sm:top-7">

                  <div className="flex items-center gap-3">

                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">

                      <Recycle size={23} />

                    </span>



                    <div>

                      <p className="text-sm font-bold">Waste to worth</p>

                      <p className="mt-1 text-xs text-slate-500">

                        Make every action count

                      </p>

                    </div>

                  </div>

                </div>



                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/30 bg-emerald-950/85 p-5 text-white backdrop-blur-lg sm:bottom-7 sm:left-7 sm:right-7 sm:p-6">

                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">

                    Our shared mission

                  </p>

                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">

                    Small actions. Lasting impact.

                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/75">

                    Better waste habits start with a smarter system.

                  </p>

                </div>

              </div>



              <div className="absolute -bottom-5 -right-2 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl sm:-right-5">

                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lime-100 text-emerald-800">

                  <Leaf size={23} />

                </span>

                <div>

                  <p className="text-sm font-extrabold">

                    Choose a greener future

                  </p>

                  <p className="mt-1 text-xs text-slate-500">

                    One pickup at a time

                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>



        {/* IMPACT STRIP */}

        <section id="impact" className="scroll-mt-24 px-5 sm:px-8 lg:px-10">

          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-emerald-900/10 bg-emerald-900/10 shadow-xl shadow-emerald-950/5 md:grid-cols-4">

            {[

              { icon: Recycle, value: "Smarter", label: "Waste management" },

              { icon: Leaf, value: "Greener", label: "Everyday choices" },

              { icon: Users, value: "Together", label: "Stronger communities" },

              { icon: ShieldCheck, value: "Cleaner", label: "Shared spaces" },

            ].map((item) => {

              const Icon = item.icon;



              return (

                <div

                  key={item.label}

                  className="flex items-center gap-3 bg-emerald-950 px-4 py-6 text-white sm:gap-4 sm:px-7 sm:py-8"

                >

                  <Icon className="shrink-0 text-lime-300" size={27} />

                  <div>

                    <p className="text-lg font-extrabold sm:text-2xl">

                      {item.value}

                    </p>

                    <p className="mt-1 text-xs text-emerald-100/75 sm:text-sm">

                      {item.label}

                    </p>

                  </div>

                </div>

              );

            })}

          </div>

        </section>



        {/* SERVICES */}

        <section

          id="services"

          className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-10"

        >

          <div className="mx-auto mb-12 max-w-2xl text-center">

            <SectionLabel>What we offer</SectionLabel>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">

              Everything you need for

              <span className="text-emerald-800">

                {" "}smarter waste management.

              </span>

            </h2>

            <p className="mt-5 leading-7 text-slate-600">

              Simple, connected tools that make responsible waste management

              easier for residents, collectors and communities.

            </p>

          </div>



          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {services.map((service) => {

              const Icon = service.icon;



              return (

                <article

                  key={service.number}

                  className="group rounded-3xl border border-emerald-950/[0.07] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-emerald-800/20 hover:shadow-xl hover:shadow-emerald-950/5 sm:p-7"

                >

                  <div className="flex items-center justify-between">

                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-800 group-hover:text-white">

                      <Icon size={25} />

                    </span>

                    <span className="text-sm font-bold text-slate-300">

                      {service.number}

                    </span>

                  </div>



                  <h3 className="mt-7 text-lg font-bold">

                    {service.title}

                  </h3>



                  <p className="mt-3 min-h-20 text-sm leading-6 text-slate-500">

                    {service.description}

                  </p>



                  <a

                    href="#how-it-works"

                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-800"

                  >

                    Learn more

                    <ArrowRight

                      size={16}

                      className="transition group-hover:translate-x-1"

                    />

                  </a>

                </article>

              );

            })}

          </div>

        </section>



        {/* HOW IT WORKS */}

        <section

          id="how-it-works"

          className="scroll-mt-24 border-y border-emerald-950/5 bg-[#f0f7f1]"

        >

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-24">

            <div>

              <SectionLabel>Simple by design</SectionLabel>

              <h2 className="max-w-lg text-3xl font-extrabold tracking-tight sm:text-5xl">

                Three simple steps.

                <span className="block text-emerald-800">

                  One cleaner tomorrow.

                </span>

              </h2>



              <p className="mt-5 max-w-lg leading-7 text-slate-600">

                We make it easier to take action, stay informed and become part

                of a more sustainable community.

              </p>



              <div className="mt-9 space-y-7">

                {steps.map((step) => (

                  <div key={step.number} className="flex gap-5">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/15">

                      {step.number}

                    </div>



                    <div>

                      <h3 className="font-bold">{step.title}</h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">

                        {step.text}

                      </p>

                    </div>

                  </div>

                ))}

              </div>



              <Link

                to={currentUser ? dashboardPath : "/signup"}

                className="mt-9 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-900"

              >

                {currentUser ? "Open Dashboard" : "Start your journey"}

                <ArrowRight size={17} />

              </Link>

            </div>



            <div className="relative">

              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-200 to-lime-100 opacity-60 blur-2xl" />



              <div className="relative overflow-hidden rounded-[2rem] bg-emerald-950 p-3 shadow-2xl">

                <img

                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1100&q=85"

                  alt="Green trees and a sustainable natural environment"

                  className="h-[350px] w-full rounded-[1.5rem] object-cover sm:h-[440px]"

                />



                <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/30 bg-white/90 p-5 backdrop-blur-xl sm:bottom-9 sm:left-9 sm:right-9">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">

                      <Truck size={25} />

                    </div>

                    <div>

                      <p className="font-extrabold">A better way forward</p>

                      <p className="mt-1 text-sm text-slate-500">

                        Technology working for a cleaner planet.

                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>



        {/* CTA */}

        <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10">

          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-emerald-950 px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16">

            <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full border-[45px] border-white/5" />

            <div className="absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-emerald-700/30 blur-3xl" />



            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">

              <div className="max-w-2xl">

                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-lime-300">

                  <Sprout size={18} />

                  YOUR CITY. YOUR PLANET. YOUR IMPACT.

                </div>



                <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">

                  A cleaner tomorrow

                  <span className="block text-lime-300">

                    starts with you.

                  </span>

                </h2>



                <p className="mt-5 max-w-xl leading-7 text-emerald-100/75">

                  Join the movement towards smarter waste management and more

                  sustainable communities.

                </p>

              </div>



              <Link

                to={currentUser ? dashboardPath : "/signup"}

                className="inline-flex shrink-0 items-center gap-3 rounded-xl bg-white px-6 py-4 text-sm font-extrabold text-emerald-950 transition hover:-translate-y-1 hover:bg-lime-100"

              >

                {currentUser ? "Open Dashboard" : "Get Started Today"}

                <ArrowRight size={18} />

              </Link>

            </div>

          </div>

        </section>

      </main>



      {/* FOOTER */}

      <footer id="contact" className="scroll-mt-24 bg-[#071f18] text-white">

        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-10">

          <div>

            <Link to="/" className="inline-flex items-center gap-2.5">

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700">

                <Leaf size={23} />

              </span>



              <span className="text-2xl font-extrabold">

                Eco<span className="text-emerald-400">Track</span>

              </span>

            </Link>



            <p className="mt-5 max-w-xs text-sm leading-7 text-slate-400">

              Making waste management smarter, communities cleaner, and our

              future greener.

            </p>

          </div>



          <div>

            <h3 className="font-bold">Explore</h3>

            <div className="mt-5 space-y-3 text-sm text-slate-400">

              <a className="block transition hover:text-white" href="#home">

                Home

              </a>

              <a className="block transition hover:text-white" href="#services">

                Our services

              </a>

              <a

                className="block transition hover:text-white"

                href="#how-it-works"

              >

                How it works

              </a>

              <a className="block transition hover:text-white" href="#impact">

                Our impact

              </a>

            </div>

          </div>



          <div>

            <h3 className="font-bold">Our services</h3>

            <div className="mt-5 space-y-3 text-sm text-slate-400">

              <p>Pickup scheduling</p>

              <p>Waste recycling</p>

              <p>Collection tracking</p>

              <p>Reports & analytics</p>

            </div>

          </div>



          <div>

            <h3 className="font-bold">Let's connect</h3>

            <p className="mt-5 text-sm leading-7 text-slate-400">

              Have questions or ideas to help your community become greener?

            </p>



            <a

              href="mailto:support@ecotrack.example"

              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-white"

            >

              Contact our team <ArrowRight size={16} />

            </a>

          </div>

        </div>



        <div className="border-t border-white/10">

          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">

            <p>

              © {new Date().getFullYear()} EcoTrack. Built for a greener tomorrow.

            </p>

            <p>Designed with purpose. Powered by sustainability.</p>

          </div>

        </div>

      </footer>

    </div>

  );

}
