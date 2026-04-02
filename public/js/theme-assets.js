/**
 * Fotos de referência (Unsplash — uso permitido com atribuição).
 * Tom “delivery premium”: hambúrguer suculento, pastel crocante, pizza com queijo, doces, bebidas geladas.
 */
export const DEFAULT_HOME_HERO =
  "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1920&q=85";

/** Fundo de página por categoria (cardápio + body) */
export const THEME_BG = {
  burger:
    "https://images.unsplash.com/photo-1553979459-b859fc4b6b29?auto=format&fit=crop&w=1920&q=82",
  pastel:
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1920&q=82",
  pizza:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1920&q=82",
  sweet:
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1920&q=82",
  default:
    "https://images.unsplash.com/photo-1544145945-f0a224ac7a5e?auto=format&fit=crop&w=1920&q=82",
};

/** Mesmas imagens, recorte horizontal para faixa no topo dos cards da home */
export const THEME_TOP_STRIP = {
  burger:
    "https://images.unsplash.com/photo-1553979459-b859fc4b6b29?auto=format&fit=crop&w=960&h=280&q=82",
  pastel:
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=960&h=280&q=82",
  pizza:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=960&h=280&q=82",
  sweet:
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=960&h=280&q=82",
  default:
    "https://images.unsplash.com/photo-1544145945-f0a224ac7a5e?auto=format&fit=crop&w=960&h=280&q=82",
};

/** Overlay mais leve no meio para a foto “saltar”; topo/rodapé escuros para o texto */
export function homeHeroOverlayGradient() {
  return "linear-gradient(180deg, rgba(15,23,42,.78) 0%, rgba(234,88,12,.18) 28%, rgba(124,45,18,.12) 48%, rgba(15,23,42,.42) 72%, rgba(2,6,23,.92) 100%)";
}
