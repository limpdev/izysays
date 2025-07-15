// Ripple effect for every mouse click, anywhere on the page using an SVG
document.addEventListener('click', function (e) {
	// Create a container for the ripple effect
	const rippleContainer = document.createElement('div');
	rippleContainer.style.position = 'fixed';
	rippleContainer.style.left = e.clientX - 48 + 'px'; // Center the ripple at click position
	rippleContainer.style.top = e.clientY - 48 + 'px';
	rippleContainer.style.pointerEvents = 'none'; // Don't interfere with further clicks
	rippleContainer.style.zIndex = '9999';

	// Create SVG element
	const svgNS = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(svgNS, 'svg');
	svg.setAttribute('width', '96');
	svg.setAttribute('height', '96');
	svg.setAttribute('viewBox', '0 0 24 24');

	// Create circle element
	const circle = document.createElementNS(svgNS, 'circle');
	circle.setAttribute('cx', '12');
	circle.setAttribute('cy', '12');
	circle.setAttribute('r', '0');
	circle.setAttribute('fill', 'rgba(168, 168, 168, 0.5)');

	// Create animate elements
	const animateRadius = document.createElementNS(svgNS, 'animate');
	animateRadius.setAttribute('attributeName', 'r');
	animateRadius.setAttribute('calcMode', 'spline');
	animateRadius.setAttribute('dur', '0.4s');
	animateRadius.setAttribute('keySplines', '.52,.6,.25,.99');
	animateRadius.setAttribute('values', '0;11');
	animateRadius.setAttribute('fill', 'freeze');

	const animateOpacity = document.createElementNS(svgNS, 'animate');
	animateOpacity.setAttribute('attributeName', 'opacity');
	animateOpacity.setAttribute('calcMode', 'spline');
	animateOpacity.setAttribute('dur', '0.4s');
	animateOpacity.setAttribute('keySplines', '.52,.6,.25,.99');
	animateOpacity.setAttribute('values', '1;0');
	animateOpacity.setAttribute('fill', 'freeze');

	// Assemble the SVG
	circle.appendChild(animateRadius);
	circle.appendChild(animateOpacity);
	svg.appendChild(circle);
	rippleContainer.appendChild(svg);

	// Add to document
	document.body.appendChild(rippleContainer);

	// Remove after animation completes
	setTimeout(() => {
		document.body.removeChild(rippleContainer);
	}, 500); // Match the duration of the animation
});

