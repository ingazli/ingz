import Image from "next/image";
import Link from "next/link";

const TOP_GALLERY_IMAGES = [
  { src: "/about/top-1.jpg", alt: "Crispy fish tacos" },
  { src: "/about/top-2.jpg", alt: "Lamb chops with salad" },
  { src: "/about/top-3.jpg", alt: "Baked casserole" },
  { src: "/about/top-4.jpg", alt: "Braised beef plated dish" },
  { src: "/about/top-5.jpg", alt: "Chicken with mash and green beans" },
  { src: "/about/top-6.jpg", alt: "Ratatouille before baking" },
];

export default function AboutPage() {
  return (
    <main
      className="relative min-h-screen text-[#3b2a1a] flex flex-col items-center pb-12"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #d5c8bb 0 5rem, #997e5f 5rem 10rem)",
      }}
    >
      <section className="w-full max-w-5xl px-4 pt-4 sm:px-6">
        <div className="flex flex-col items-center text-center gap-10 py-8">
          <div className="w-full px-4 pb-8 text-center">
            <div className="relative mx-auto max-w-[42rem] sm:max-w-[50rem] overflow-hidden rounded-[3rem]">
              <div className="absolute inset-x-0 top-5 z-20 flex w-full flex-col items-center justify-center gap-3 px-4 sm:flex-row sm:px-6">
                <Link
                  href="/request-quote"
                  className="inline-flex min-w-[12rem] items-center justify-center rounded-full bg-[#2f6f3d] px-10 py-4 text-base font-semibold text-white shadow-2xl shadow-black/20 transition hover:bg-[#256132]"
                >
                  Request a Quote
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-w-[12rem] items-center justify-center rounded-full bg-[#2f6f3d] px-10 py-4 text-base font-semibold text-white shadow-2xl shadow-black/20 transition hover:bg-[#256132]"
                >
                  Client Login
                </Link>
              </div>
              <Image
                src="/CHEF.png"
                alt="Chef Inga logo"
                width={1600}
                height={1600}
                className="mx-auto h-auto w-full"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 px-4 pb-8">
                <div className="relative mx-auto max-w-3xl px-6 py-5">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 1000 220"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                  >
                    <path
                      d="M70,18 C120,4 180,4 230,18 C285,34 330,34 385,18 C440,2 505,2 560,18 C615,34 670,34 725,18 C780,2 845,2 900,18 C942,30 968,58 978,110 C968,162 942,190 900,202 C845,218 780,218 725,202 C670,186 615,186 560,202 C505,218 440,218 385,202 C330,186 285,186 230,202 C180,216 120,216 70,202 C28,190 2,162 2,110 C2,58 28,30 70,18 Z"
                      fill="rgba(234,215,191,0.48)"
                    />
                  </svg>
                  <p className="relative z-10 text-lg sm:text-xl md:text-2xl font-semibold leading-8 text-[#3b2a1a]">
                    Personal chef meal prep designed for busy lives. Fresh ingredients, seasonal menus, and a personalized meal plan that fits your lifestyle.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="z-20 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm">
            <div className="grid w-full grid-cols-6">
              {TOP_GALLERY_IMAGES.map((image) => (
                <div
                  key={image.src}
                  className="relative aspect-square w-full overflow-hidden"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={1200}
                    height={1200}
                    className="h-full w-full object-cover object-center"
                    sizes="16.7vw"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center rounded-3xl bg-white/60 border border-white/10 p-8 shadow-2xl">
            <div>
              <p className="text-lg uppercase tracking-[0.35em] text-[#6b4b31] mb-4">
                About
              </p>
              <h1 className="text-4xl sm:text-5xl leading-tight text-[#3b2a1a]">
                <span className="font-ingrid">Chef Inga</span>{" "}
                <span className="font-playfair text-[calc(1em-50pt)] font-semilight leading-none">
                  brings intentional flavor and care to every meal.
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-8 text-[#3b2a1a]/90">
                Welcome to a place where weekly menus are crafted around your tastes, preferences, and nutrition goals. This is your space to enjoy delicious, nourishing meals that simplify life and celebrate seasonal food.
              </p>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 flex flex-col items-center justify-center min-h-[22rem]">
              <div className="mb-4 text-sm uppercase tracking-[0.3em] text-[#6b4b31]">
                Photo placeholder
              </div>
              <div className="h-64 w-full rounded-3xl border-2 border-dashed border-[#6b4b31]/40 bg-white/10 flex items-center justify-center text-center px-4">
                <span className="text-sm text-[#3b2a1a]/80 max-w-[16rem]">
                  Add a picture of yourself here later.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
