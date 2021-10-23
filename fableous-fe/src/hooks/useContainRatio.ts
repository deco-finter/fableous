import { useResizeDetector } from "react-resize-detector";

/**
 * Returns dimension of child DOM that maintains aspect ratio
 * and is contained within container
 *
 * @param {React.MutableRefObject<T>} containerRef Ref to container
 * @param {number} ratio Width to height ratio
 *
 * @return {[number, number]} width and height
 */
export default function useContainRatio<T>(config: {
  containerRef: React.MutableRefObject<T>;
  ratio: number;
}): [number, number] {
  const { containerRef, ratio } = config;

  const { width, height } = useResizeDetector({
    targetRef: containerRef,
  });

  const isPotrait = (width || 0) / (height || 1) > ratio;
  const containedWidth = isPotrait ? (height || 0) * ratio : width || 0;
  const containedHeight = containedWidth / ratio;

  return [containedWidth, containedHeight];
}
