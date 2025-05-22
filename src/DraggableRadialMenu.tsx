import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Home, Settings, User, MessageSquare, Share2, ThumbsUp, Star, Menu as MenuIcon, X as XIcon, LucideProps } from 'lucide-react';

// Interfaces
interface MenuItem {
  id: string;
  icon: React.FC<LucideProps>;
  label: string;
  description?: string;
  action?: () => void;
}

interface DraggableRadialMenuProps {
  items: MenuItem[];
  orbitRadius?: number;
  itemSize?: number;
  mainButtonSize?: number;
  itemIconSize?: number;
  mainIconSize?: number;
  dragThreshold?: number;
  hoverScale?: number;
}

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  initialPosition?: Position;
  constrainElementSize?: number;
  dragThreshold?: number;
}

// --- useDraggable Hook ---
const DEFAULT_DRAG_THRESHOLD = 5;

function useDraggable(
  ref: React.RefObject<HTMLDivElement>,
  options?: UseDraggableOptions
) {
  const constrainElementSize = options?.constrainElementSize ?? ref.current?.offsetWidth ?? 50;
  const dragThreshold = options?.dragThreshold ?? DEFAULT_DRAG_THRESHOLD;

  const [position, setPosition] = useState<Position>(() => {
    const initialX = options?.initialPosition?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
    const initialY = options?.initialPosition?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
    return { x: initialX - constrainElementSize / 2, y: initialY - constrainElementSize / 2 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMovedBeyondThreshold, setHasMovedBeyondThreshold] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState<Position>({ x: 0, y: 0 });
  const [interactionStartCoords, setInteractionStartCoords] = useState<Position | null>(null);

  const isDraggingRef = useRef(isDragging);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const getEventCoordinates = (event: MouseEvent | TouchEvent): Position => {
    if ('touches' in event) {
      if (event.touches.length > 0) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
      if (event.changedTouches.length > 0) {
        return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
      }
    }
    return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
  };
  
  const handleInteractionStart = useCallback((event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    // console.log('[useDraggable] handleInteractionStart triggered. Coords: ', event.type);
    if (ref.current) {
      if ('button' in event && event.button !== 0) return; 

      if (event.type === 'touchstart') {
        event.preventDefault();
      }

      const coords = getEventCoordinates(event.nativeEvent as MouseEvent | TouchEvent);
      
      setDragStartOffset({
        x: coords.x - ref.current.getBoundingClientRect().left,
        y: coords.y - ref.current.getBoundingClientRect().top,
      });
      setInteractionStartCoords({ x: coords.x, y: coords.y });
      setHasMovedBeyondThreshold(false); 
      setIsDragging(true);
      // console.log('[useDraggable] handleInteractionStart: setIsDragging(true) called.');
    }
  }, [ref, dragThreshold, constrainElementSize]);


  useEffect(() => {
    const handleInteractionMove = (event: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !ref.current) return;
      // console.log('[useDraggable] handleInteractionMove. isDraggingRef.current:', isDraggingRef.current);

      if (event.type === 'touchmove') {
        event.preventDefault(); 
      }

      const coords = getEventCoordinates(event);

      if (interactionStartCoords && !hasMovedBeyondThreshold) {
        const dx = coords.x - interactionStartCoords.x;
        const dy = coords.y - interactionStartCoords.y;
        if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
          setHasMovedBeyondThreshold(true);
          // console.log('[useDraggable] Drag threshold exceeded.');
        }
      }
      
      let newX = coords.x - dragStartOffset.x;
      let newY = coords.y - dragStartOffset.y;
      
      const currentConstrainSize = options?.constrainElementSize ?? ref.current.offsetWidth;

      newX = Math.max(0, Math.min(newX, window.innerWidth - currentConstrainSize));
      newY = Math.max(0, Math.min(newY, window.innerHeight - currentConstrainSize));
      
      // console.log('[useDraggable] Setting position: ', {x: newX, y: newY});
      setPosition({ x: newX, y: newY });
    };

    const handleInteractionEnd = (event: MouseEvent | TouchEvent) => {
      // console.log('[useDraggable] handleInteractionEnd triggered on window. Event type:', event.type);
      setIsDragging(false);
      // console.log('[useDraggable] handleInteractionEnd: setIsDragging(false) called.');
    };

    if (isDragging) {
      // console.log('[useDraggable] EFFECT for event listeners. isDragging=true. ADDING window event listeners (mouse & touch).');
      window.addEventListener('mousemove', handleInteractionMove);
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchmove', handleInteractionMove, { passive: false });
      window.addEventListener('touchend', handleInteractionEnd);
      
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none'; 
    } else {
      // console.log('[useDraggable] EFFECT for event listeners. isDragging=false. REMOVING window event listeners (mouse & touch).');
      window.removeEventListener('mousemove', handleInteractionMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleInteractionMove);
      window.removeEventListener('touchend', handleInteractionEnd);
      
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }

    return () => {
      // console.log('[useDraggable] CLEANUP for event listener effect. REMOVING window event listeners (mouse & touch).');
      window.removeEventListener('mousemove', handleInteractionMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleInteractionMove);
      window.removeEventListener('touchend', handleInteractionEnd);
      
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragging, dragStartOffset, ref, options?.constrainElementSize, interactionStartCoords, hasMovedBeyondThreshold, dragThreshold, setPosition]);

  useEffect(() => {
    const handleResize = () => {
      if (ref.current) {
        const currentConstrainSize = options?.constrainElementSize ?? ref.current.offsetWidth;
        // console.log('[useDraggable] Window resized. Adjusting position.');
        setPosition(prev => ({
          x: Math.max(0, Math.min(prev.x, window.innerWidth - currentConstrainSize)),
          y: Math.max(0, Math.min(prev.y, window.innerHeight - currentConstrainSize)),
        }));
      }
    };
    if (typeof window !== 'undefined') {
        // console.log('[useDraggable] Adding resize listener.');
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call
    }
    return () => {
        if (typeof window !== 'undefined') {
            // console.log('[useDraggable] Removing resize listener.');
            window.removeEventListener('resize', handleResize);
        }
    };
  }, [ref, options?.constrainElementSize, setPosition]);
  
  return { position, handleInteractionStart, isDragging, hasMovedBeyondThreshold };
}


// --- useRadialMenuPositions Hook ---
interface MenuItemPosition {
  x: number;
  y: number;
  angle: number;
}

interface SafeArc {
  start: number;
  end: number;
  length: number;
}

interface UseRadialMenuPositionsProps {
  isOpen: boolean;
  centerPosition: Position;
  numItems: number;
  initialOrbitRadius: number; 
  itemSize: number;
  mainButtonSize: number;
}

const ANGLE_EPSILON = 1e-5;
const MAX_ITERATIONS_FOR_RADIUS_ADJUSTMENT = 15;
const ORBIT_RADIUS_INCREMENT_PIXELS = 10; 
const MAX_ORBIT_RADIUS_FACTOR = 4; 

function useRadialMenuPositions({
  isOpen,
  centerPosition,
  numItems,
  initialOrbitRadius,
  itemSize,
  mainButtonSize,
}: UseRadialMenuPositionsProps) {
  // ADDED LOG: To see received centerPosition on every render of this hook
  console.log(`%c[useRadialMenuPositions] HOOK CALLED. isOpen: ${isOpen}, centerPosition: (${centerPosition.x.toFixed(0)}, ${centerPosition.y.toFixed(0)})`, 'color: cyan;');

  const [itemPositions, setItemPositions] = useState<MenuItemPosition[]>([]);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    const handleResize = () => {
      // console.log('[RadialMenu] Viewport resized:', { width: window.innerWidth, height: window.innerHeight });
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return () => {};
  }, []);

  useEffect(() => {
    console.log(`%c[RadialMenu] TOP LEVEL useEffect TRIGGERED. isOpen: ${isOpen}, center: (${centerPosition.x.toFixed(0)}, ${centerPosition.y.toFixed(0)})`, 'color: orange; font-weight: bold;');

    if (!isOpen || numItems === 0 || typeof window === 'undefined' || initialOrbitRadius <= 0) {
      console.log(`[RadialMenu] Early exit: isOpen=${isOpen}, numItems=${numItems}, initialOrbitRadius=${initialOrbitRadius}`);
      setItemPositions([]);
      return;
    }

    console.log(`[RadialMenu] Recalculating positions. numItems: ${numItems}, initialOrbitRadius: ${initialOrbitRadius}, center: (${centerPosition.x.toFixed(0)}, ${centerPosition.y.toFixed(0)})`);

    let currentOrbitRadius = initialOrbitRadius;
    const maxOrbitRadius = initialOrbitRadius * MAX_ORBIT_RADIUS_FACTOR;
    let calculatedPositions: MenuItemPosition[] = [];
    let iterationCount = 0;

    const mainButtonCenter = {
      x: centerPosition.x + mainButtonSize / 2,
      y: centerPosition.y + mainButtonSize / 2,
    };
    const itemRadius = itemSize / 2;

    console.log(`[RadialMenu] Starting radius adjustment. Initial: ${initialOrbitRadius}, Max: ${maxOrbitRadius.toFixed(2)}, ItemSize: ${itemSize}, Viewport: ${viewportSize.width}x${viewportSize.height}`);

    while (iterationCount < MAX_ITERATIONS_FOR_RADIUS_ADJUSTMENT) {
      iterationCount++;
      calculatedPositions = []; 
      console.log(`[RadialMenu] Iteration: ${iterationCount}, CurrentOrbitRadius: ${currentOrbitRadius.toFixed(2)}`);

      const isSafeAngle = (angle: number): boolean => {
        const itemCenterX = mainButtonCenter.x + currentOrbitRadius * Math.cos(angle);
        const itemCenterY = mainButtonCenter.y + currentOrbitRadius * Math.sin(angle);
        const safe = (
          itemCenterX - itemRadius >= 0 &&
          itemCenterX + itemRadius <= viewportSize.width &&
          itemCenterY - itemRadius >= 0 &&
          itemCenterY + itemRadius <= viewportSize.height
        );
        // if (!safe) console.log(`[RadialMenu] Unsafe angle: ${angle * 180 / Math.PI} deg at radius ${currentOrbitRadius.toFixed(1)} for item center (${itemCenterX.toFixed(1)}, ${itemCenterY.toFixed(1)})`);
        return safe;
      };

      const resolution = 360; 
      const angleStep = (2 * Math.PI) / resolution;
      const potentialAngles: { angle: number; safe: boolean }[] = [];
      for (let i = 0; i < resolution; i++) {
        const angle = i * angleStep;
        potentialAngles.push({ angle, safe: isSafeAngle(angle) });
      }

      const safeArcs: SafeArc[] = [];
      let currentArcStart: number | null = null;

      for (let i = 0; i <= resolution; i++) {
        const isCurrentSafe = i < resolution ? potentialAngles[i].safe : false;
        const currentAngle = i < resolution ? potentialAngles[i].angle : (potentialAngles[resolution-1]?.angle + angleStep || 2 * Math.PI) ;

        if (isCurrentSafe && currentArcStart === null) {
          currentArcStart = currentAngle;
        } else if (!isCurrentSafe && currentArcStart !== null) {
          if (currentAngle > currentArcStart + ANGLE_EPSILON) {
            safeArcs.push({ start: currentArcStart, end: currentAngle, length: currentAngle - currentArcStart });
          }
          currentArcStart = null;
        }
      }
      
      if (potentialAngles.length > 0 && potentialAngles[0].safe && potentialAngles[resolution - 1].safe && safeArcs.length > 1) {
        const firstArcIndex = safeArcs.findIndex(arc => Math.abs(arc.start - potentialAngles[0].angle) < ANGLE_EPSILON);
        const lastArcIndex = safeArcs.findIndex(arc => Math.abs(arc.end - (potentialAngles[resolution-1].angle + angleStep)) < ANGLE_EPSILON);

        if (firstArcIndex !== -1 && lastArcIndex !== -1 && firstArcIndex !== lastArcIndex) {
            const firstArc = safeArcs[firstArcIndex];
            const lastArc = safeArcs[lastArcIndex];
            
            const combinedArc: SafeArc = {
                start: lastArc.start,
                end: firstArc.end + 2 * Math.PI, 
                length: lastArc.length + firstArc.length
            };
            
            const remainingArcs = safeArcs.filter((_, index) => index !== firstArcIndex && index !== lastArcIndex);
            safeArcs.splice(0, safeArcs.length, ...remainingArcs, combinedArc);
        }
      }
      
      let totalSafeAngleLength = safeArcs.reduce((sum, arc) => sum + arc.length, 0);
      console.log(`[RadialMenu] Found ${safeArcs.length} safe arcs. Total safe angle: ${(totalSafeAngleLength * 180 / Math.PI).toFixed(1)} deg`);
      // safeArcs.forEach(arc => console.log(`  Arc: start ${(arc.start * 180 / Math.PI).toFixed(1)}, end ${(arc.end * 180 / Math.PI).toFixed(1)}, length ${(arc.length * 180 / Math.PI).toFixed(1)}`));


      if (numItems > 0) {
        if (totalSafeAngleLength < ANGLE_EPSILON * numItems) {
            console.log(`[RadialMenu] Total safe angle too small or zero. Distributing evenly as fallback.`);
            const angleBetweenItems = (2 * Math.PI) / numItems;
            for (let i = 0; i < numItems; i++) {
                const angle = i * angleBetweenItems;
                calculatedPositions.push({
                    x: currentOrbitRadius * Math.cos(angle),
                    y: currentOrbitRadius * Math.sin(angle),
                    angle: angle,
                });
            }
        } else {
            const anglePerItemSlot = totalSafeAngleLength / numItems;
            safeArcs.sort((a, b) => a.start - b.start);

            let currentArcProcessedLength = 0;
            for (let i = 0; i < numItems; i++) {
                const targetCenterAngleInConcatenatedSpace = (i + 0.5) * anglePerItemSlot;
                let placed = false;

                for (const arc of safeArcs) {
                    if (targetCenterAngleInConcatenatedSpace >= currentArcProcessedLength - ANGLE_EPSILON &&
                        targetCenterAngleInConcatenatedSpace < currentArcProcessedLength + arc.length + ANGLE_EPSILON) {
                        
                        const angleOffsetWithinArc = targetCenterAngleInConcatenatedSpace - currentArcProcessedLength;
                        const clampedAngleOffset = Math.max(0, Math.min(angleOffsetWithinArc, arc.length));
                        
                        let finalAngle = arc.start + clampedAngleOffset;
                        finalAngle = finalAngle % (2 * Math.PI);

                        calculatedPositions.push({
                            x: currentOrbitRadius * Math.cos(finalAngle),
                            y: currentOrbitRadius * Math.sin(finalAngle),
                            angle: finalAngle,
                        });
                        placed = true;
                        break;
                    }
                    currentArcProcessedLength += arc.length;
                }
                 if (!placed) { 
                    console.warn(`[RadialMenu] Item ${i} could not be placed in safe arcs. Fallback placement.`);
                    const fallbackAngle = safeArcs.length > 0 ? (safeArcs[0].start + safeArcs[0].length / 2) % (2 * Math.PI) : (i * (2 * Math.PI / numItems));
                    calculatedPositions.push({
                        x: currentOrbitRadius * Math.cos(fallbackAngle),
                        y: currentOrbitRadius * Math.sin(fallbackAngle),
                        angle: fallbackAngle,
                    });
                }
            }
        }
      }
      
      let overlapDetected = false;
      if (calculatedPositions.length > 1) {
        for (let i = 0; i < calculatedPositions.length; i++) {
          for (let j = i + 1; j < calculatedPositions.length; j++) {
            const dx = calculatedPositions[i].x - calculatedPositions[j].x;
            const dy = calculatedPositions[i].y - calculatedPositions[j].y;
            const distanceSquared = dx * dx + dy * dy;
            
            if (distanceSquared < (itemSize * itemSize) - ANGLE_EPSILON) { // Check if distance is less than itemSize
              overlapDetected = true;
              console.log(`[RadialMenu] Overlap detected between item ${i} and ${j} at radius ${currentOrbitRadius.toFixed(1)}. Dist sq: ${distanceSquared.toFixed(1)}, ItemSize sq: ${(itemSize*itemSize).toFixed(1)}`);
              break;
            }
          }
          if (overlapDetected) break;
        }
      }
      console.log(`[RadialMenu] Overlap detected: ${overlapDetected}`);

      if (!overlapDetected) {
        console.log(`[RadialMenu] No overlap detected. Final radius: ${currentOrbitRadius.toFixed(2)}`);
        break; 
      }

      if (currentOrbitRadius >= maxOrbitRadius) {
        console.warn(`[RadialMenu] Max orbit radius ${maxOrbitRadius.toFixed(2)} reached at iteration ${iterationCount}. Items might still overlap. Final radius: ${currentOrbitRadius.toFixed(2)}`);
        break; 
      }
      
      currentOrbitRadius += ORBIT_RADIUS_INCREMENT_PIXELS;
      currentOrbitRadius = Math.min(currentOrbitRadius, maxOrbitRadius);
      console.log(`[RadialMenu] Radius incremented to: ${currentOrbitRadius.toFixed(2)}`);

    } 

    if (iterationCount >= MAX_ITERATIONS_FOR_RADIUS_ADJUSTMENT && calculatedPositions.length > 1) {
        let finalOverlapCheck = false;
        for (let i = 0; i < calculatedPositions.length; i++) {
            for (let j = i + 1; j < calculatedPositions.length; j++) {
                const dx = calculatedPositions[i].x - calculatedPositions[j].x;
                const dy = calculatedPositions[i].y - calculatedPositions[j].y;
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared < (itemSize * itemSize) - ANGLE_EPSILON) {
                    finalOverlapCheck = true;
                    break;
                }
            }
            if (finalOverlapCheck) break;
        }
        if (finalOverlapCheck) {
            console.warn(`[RadialMenu] Max iterations (${MAX_ITERATIONS_FOR_RADIUS_ADJUSTMENT}) reached, items might still overlap. Final radius: ${currentOrbitRadius.toFixed(2)}`);
        } else {
            console.log(`[RadialMenu] Max iterations reached, but no overlap in final check. Final radius: ${currentOrbitRadius.toFixed(2)}`);
        }
    }
    
    console.log(`[RadialMenu] Setting final item positions with radius: ${currentOrbitRadius.toFixed(2)}`, calculatedPositions.map(p => ({x: p.x.toFixed(1), y: p.y.toFixed(1), angle: (p.angle * 180/Math.PI).toFixed(1) })));
    setItemPositions(calculatedPositions.sort((a,b) => a.angle - b.angle));

  }, [isOpen, centerPosition, numItems, initialOrbitRadius, itemSize, mainButtonSize, viewportSize]); // Added viewportSize here as it's used in the effect

  return itemPositions;
}


// --- DraggableRadialMenu Component ---
const DEFAULT_ORBIT_RADIUS = 100;
const DEFAULT_ITEM_SIZE = 40;
const DEFAULT_MAIN_BUTTON_SIZE = 56;
const DEFAULT_ITEM_ICON_SIZE = 20;
const DEFAULT_MAIN_ICON_SIZE = 28;
const CLICK_TIMEOUT_DURATION = 100; 
const DEFAULT_HOVER_SCALE = 1.3;
const ITEM_DESCRIPTION_SCALE_FACTOR = 0.6; 

export const DraggableRadialMenu: React.FC<DraggableRadialMenuProps> = ({
  items,
  orbitRadius = DEFAULT_ORBIT_RADIUS,
  itemSize = DEFAULT_ITEM_SIZE,
  mainButtonSize = DEFAULT_MAIN_BUTTON_SIZE,
  itemIconSize = DEFAULT_ITEM_ICON_SIZE,
  mainIconSize = DEFAULT_MAIN_ICON_SIZE,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
  hoverScale = DEFAULT_HOVER_SCALE,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInteractingWithButton, setIsInteractingWithButton] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  const { position, handleInteractionStart, hasMovedBeyondThreshold } = useDraggable(menuRef, {
    initialPosition: { 
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 
    },
    constrainElementSize: mainButtonSize,
    dragThreshold: dragThreshold,
  });

  // ADDED LOG: To see the position from useDraggable before passing to useRadialMenuPositions
  console.log(`%c[DraggableRadialMenu] Component Render. position from useDraggable: (${position.x.toFixed(0)}, ${position.y.toFixed(0)}), isOpen: ${isOpen}`, 'color: green;');

  const itemPositions = useRadialMenuPositions({
    isOpen,
    centerPosition: position, // This is the 'position' from useDraggable
    numItems: items.length,
    initialOrbitRadius: orbitRadius, 
    itemSize,
    mainButtonSize,
  });

  const toggleMenu = () => {
    if (!isInteractingWithButton && !hasMovedBeyondThreshold) {
      // console.log('[RadialMenu] toggleMenu called. Current isOpen:', isOpen, 'hasMovedBeyondThreshold:', hasMovedBeyondThreshold);
      setIsOpen(prev => !prev);
      setIsInteractingWithButton(true); 
      setTimeout(() => setIsInteractingWithButton(false), CLICK_TIMEOUT_DURATION);
    } else {
      // console.log('[RadialMenu] toggleMenu skipped. isInteractingWithButton:', isInteractingWithButton, 'hasMovedBeyondThreshold:', hasMovedBeyondThreshold);
    }
  };
  
  const MainIconComponent = isOpen ? XIcon : MenuIcon;

  const memoizedItems = useMemo(() => items.map((item, index) => {
    const pos = itemPositions[index];
    if (!pos) return null;

    const isHovered = item.id === hoveredItemId;
    
    const itemDisplayX = mainButtonSize / 2 + pos.x - itemSize / 2;
    const itemDisplayY = mainButtonSize / 2 + pos.y - itemSize / 2;
    
    const scale = isOpen ? (isHovered ? hoverScale : 1) : 0.5;
    const showDescription = isHovered && isOpen && item.description;
    
    const currentIconSize = showDescription ? itemIconSize * ITEM_DESCRIPTION_SCALE_FACTOR : itemIconSize;
    const descriptionFontSize = itemIconSize * 0.45 * ITEM_DESCRIPTION_SCALE_FACTOR; 
    
    const paddingTopForDescription = showDescription ? `${currentIconSize * 0.25}px` : '0px';
    const descriptionMarginTop = showDescription ? `${currentIconSize * 0.2}px` : '0px';
    const itemPadding = showDescription ? '0px' : '2px'; 

    return (
      <div
        key={item.id}
        style={{
          position: 'absolute',
          width: itemSize,
          height: itemSize,
          left: `${itemDisplayX}px`,
          top: `${itemDisplayY}px`,
          opacity: isOpen ? 1 : 0,
          transform: `scale(${scale})`,
          transformOrigin: `center center`, 
          transitionProperty: 'opacity, transform, z-index, padding',
          transitionDuration: '0.3s',
          transitionTimingFunction: isOpen ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'ease-out',
          zIndex: isHovered ? 10 : 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: itemPadding, 
        }}
        className="rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg cursor-pointer"
        title={!showDescription ? item.label : ""} 
        onMouseEnter={() => isOpen && setHoveredItemId(item.id)}
        onMouseLeave={() => isOpen && setHoveredItemId(null)}
        onClick={() => {
          // console.log(`[RadialMenu] Item "${item.label}" clicked.`);
          item.action?.();
          setIsOpen(false);
          setHoveredItemId(null);
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          transitionProperty: 'padding-top',
          transitionDuration: '0.3s',
          transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: showDescription ? 'flex-start' : 'center',
          textAlign: 'center',
          paddingTop: paddingTopForDescription,
          overflow: 'hidden', 
          borderRadius: 'inherit', 
        }}>
          <div style={{ flexShrink: 0 }}> 
            <item.icon size={currentIconSize} />
          </div>
          {showDescription && (
            <span style={{
              fontSize: `${descriptionFontSize}px`,
              marginTop: descriptionMarginTop,
              lineHeight: '1.2',
              userSelect: 'none',
              width: '90%', 
              textAlign: 'center',
              whiteSpace: 'normal', 
              wordBreak: 'break-word', 
            }}>
              {item.description}
            </span>
          )}
        </div>
      </div>
    );
  }), [items, itemPositions, isOpen, mainButtonSize, itemSize, itemIconSize, hoveredItemId, hoverScale]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: mainButtonSize,
        height: mainButtonSize,
        zIndex: 1000, 
        touchAction: 'none', 
      }}
    >
      <button
        type="button"
        onMouseDown={handleInteractionStart}
        onTouchStart={handleInteractionStart}
        onMouseUp={toggleMenu}
        onTouchEnd={toggleMenu}
        style={{
          width: mainButtonSize,
          height: mainButtonSize,
          position: 'relative', 
          zIndex: 1, 
        }}
        className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <MainIconComponent size={mainIconSize} />
      </button>
      <div 
        className="absolute"
        style={{ 
          top: `0px`, 
          left: `0px`,
          width: `${mainButtonSize}px`,
          height: `${mainButtonSize}px`,
          pointerEvents: isOpen ? 'auto' : 'none' 
        }}
      >
        {memoizedItems}
      </div>
    </div>
  );
};

export default DraggableRadialMenu;
