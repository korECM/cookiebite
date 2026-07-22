// Rasterize a rendered Recharts SVG to PNG so a chart can be dropped into a
// deck or a Slack thread. Browser-only — the caller guards on `document`.

/**
 * Presentation properties Recharts sets through CSS classes and custom
 * properties. A detached clone loses all of them, and `var(--chart-1)` will not
 * resolve inside an `<img>`, so each one is copied over as an inline attribute.
 */
const INLINED = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
] as const;

function inlineComputedStyles(source: Element, clone: Element): void {
  const computed = getComputedStyle(source);
  const declarations: string[] = [];
  for (const property of INLINED) {
    const value = computed.getPropertyValue(property);
    if (value && value !== 'none' && value !== 'normal') {
      declarations.push(`${property}:${value}`);
    }
  }
  if (declarations.length > 0) {
    clone.setAttribute('style', declarations.join(';'));
  }

  const sourceChildren = source.children;
  const cloneChildren = clone.children;
  for (let i = 0; i < sourceChildren.length; i += 1) {
    const child = cloneChildren[i];
    if (child) inlineComputedStyles(sourceChildren[i], child);
  }
}

export interface SvgToPngOptions {
  /** Device-pixel multiplier. 2 keeps the export crisp on retina and in decks. */
  scale?: number;
  /** Painted behind the chart so a dark-theme export is not transparent. */
  background?: string;
}

/**
 * Returns a PNG blob, or `null` when the chart has not laid out yet (zero-size
 * SVG). Text falls back to a system font — the report's embedded webfont is not
 * reachable from inside a rasterized `<img>`.
 */
export function svgToPngBlob(
  svg: SVGSVGElement,
  options: SvgToPngOptions = {},
): Promise<Blob | null> {
  const rect = svg.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width === 0 || height === 0) return Promise.resolve(null);

  const scale = options.scale ?? 2;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineComputedStyles(svg, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  const markup = new XMLSerializer().serializeToString(clone);
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(null);
        return;
      }
      if (options.background) {
        context.fillStyle = options.background;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };
    image.onerror = () => reject(new Error('svgToPngBlob: could not rasterize SVG'));
    image.src = source;
  });
}

/** Hands a blob to the browser as a download and releases the object URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
