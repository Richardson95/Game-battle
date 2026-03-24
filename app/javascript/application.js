import "@hotwired/turbo-rails"
import "controllers"

// Inject FX keyframes at runtime
const style = document.createElement("style")
style.textContent = `
  @keyframes fxHitAnim {
    0%   { transform: scale(0.5) rotate(-10deg); opacity: 1; }
    60%  { transform: scale(1.3) rotate(5deg); opacity: 1; }
    100% { transform: scale(1.0) translateY(-30px); opacity: 0; }
  }
  @keyframes fxTextAnim {
    0%   { transform: translateY(0) scale(1); opacity: 1; }
    80%  { transform: translateY(-50px) scale(1.2); opacity: 1; }
    100% { transform: translateY(-80px) scale(1); opacity: 0; }
  }
`
document.head.appendChild(style)
