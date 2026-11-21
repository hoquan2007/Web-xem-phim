import Image from "next/image";

/**
 * Runs before first paint: marks the first visit of a browser session (and only
 * when motion is allowed) so CSS can play the brand curtain. Without scripting the
 * attribute is never set and the curtain never renders.
 */
export const INTRO_SCRIPT = `try{var d=document.documentElement;if(!sessionStorage.getItem("ptq-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-intro","");sessionStorage.setItem("ptq-intro","1");setTimeout(function(){d.removeAttribute("data-intro")},3200)}}catch(e){}`;

/** Once-per-session entrance: the PTQ mark settles, a gold sweep, then the curtain lifts. */
export function IntroCurtain() {
  return (
    <div className="intro-curtain" aria-hidden="true">
      <div className="intro-mark">
        <Image
          src="/images/ptq-film-logo.png"
          width={88}
          height={88}
          sizes="88px"
          alt=""
          loading="eager"
        />
        <span className="intro-word">
          PTQ<span>Film</span>
        </span>
      </div>
      <span className="intro-sweep" />
    </div>
  );
}
