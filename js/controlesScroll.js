import { Inertie } from './inertie.js';

class ControlesScroll
{
	constructor(element)
	{
		this.element = element;
		
		this.inertie = new Inertie(element);
		this.SEUIL_DEPLACEMENT = 5;
		this.geste = null;
		this.dragging = false;
		this.clicApresDrag = false;
		
		this.initialiser();
	}
		
	debutDuGeste = (event) =>
	{	
		this.inertie.annuler();

		const elementsScroll = this.obtenirElementsScroll(event.target);

		if (!elementsScroll.x && !elementsScroll.y)	return;
		
		this.geste =
		{
			pointerId: event.pointerId,
			pointerType: event.pointerType,
			
			startX: event.clientX,
			startY: event.clientY,

			startScrollLeft: elementsScroll.x?.scrollLeft ?? null,
			startScrollTop: elementsScroll.y?.scrollTop ?? null,

			elementsScroll: elementsScroll,
						
			direction: null,

			dragging: false
		};
	}
	
	determinerDirection = (deltaX, deltaY) =>
	{
		const absX = Math.abs(deltaX);
		const absY = Math.abs(deltaY);

		if (absX < this.SEUIL_DEPLACEMENT && absY < this.SEUIL_DEPLACEMENT)
		{
			return null;
		}

		if (absX > absY)
		{
			if (this.geste.elementsScroll.x && this.geste.elementsScroll.x.scrollWidth > this.geste.elementsScroll.x.clientWidth)
			{
				return 'horizontal';
			}

			return null;
		}

		if (this.geste.elementsScroll.y && this.geste.elementsScroll.y.scrollHeight > this.geste.elementsScroll.y.clientHeight)
		{
			return 'vertical';
		}

		return null;
	}

	gererLeDeplacement = (event) =>
	{	
		// console.log('MOVE', event.pointerType,event.clientX,event.clientY);

		// Vérifier qu'un geste est en cours
		if (!this.geste) return;

		// Ignorer les événements provenant d'un autre pointeur
		if (event.pointerId !== this.geste.pointerId) return;

		// Calculer les écarts depuis le début du geste
		const deltaX = event.clientX - this.geste.startX;
		const deltaY = event.clientY - this.geste.startY;
	
		// console.log('MOVE', 'deltaX =', deltaX, 'deltaY =', deltaY, 'direction =',this.geste.direction);

		// Déterminer et verrouiller la direction du geste		
		if (!this.geste.direction)
		{
			this.geste.direction = this.determinerDirection(deltaX, deltaY);

			//  console.log('DIRECTION DETERMINEE =', this.geste.direction);
	
			if (this.geste.direction)
			{
				this.geste.dragging = true;
				this.dragging = true;
				this.clicApresDrag = true;
			}
		}

		// Déplacer l'élément dans la direction verrouillée
		if (this.geste.direction === 'horizontal')
		{
			this.geste.elementsScroll.x.scrollLeft = this.geste.startScrollLeft - deltaX;
		}

		if (this.geste.direction === 'vertical')
		{
			this.geste.elementsScroll.y.scrollTop = this.geste.startScrollTop - deltaY;
		}

		// console.log('direction :', this.geste.direction);
		
		// Définir la cible de l'inertie
		if (this.geste.direction)
		{
			this.geste.dragging = true;
			
			const elementScroll = 
				this.geste.direction === 'horizontal'
				? this.geste.elementsScroll.x
				: this.geste.elementsScroll.y;

			this.inertie.definirCible(elementScroll, this.geste.direction);
		}
		
		// Enregistrer la position du pointeur pour l'inertie
		if (this.geste.direction === 'horizontal')
		{
			// console.log('POSITION', event.pointerType,event.clientX,event.clientY);

			this.inertie.ajouterPosition(event.clientX);
		}

		if (this.geste.direction === 'vertical')
		{
			//  console.log('POSITION',event.pointerType,event.clientX,event.clientY);

			this.inertie.ajouterPosition(event.clientY);
		}
	}

	reinitialiserGeste = (avecInertie) =>
	{
		// console.log('REINITIALISER GESTE', 'avecInertie =',avecInertie, 'geste =',this.geste);
	
		if (!this.geste) return;

		if (avecInertie && this.geste.dragging)
		{
			this.inertie.calculerVelocite();
			this.inertie.scrollAvecInertie();
		}

		if (this.element.hasPointerCapture(this.geste.pointerId))
		{
			this.element.releasePointerCapture(this.geste.pointerId);
		}
		
		this.dragging = false;
		this.geste = null;
	}

	obtenirElementsScroll = (element) =>
	{
		const elementsScroll = {};

		while (element)
		{
			const axes = element.dataset?.scroll;

			if (axes)
			{
				if (axes.includes('x') && !elementsScroll.x)
				{
					elementsScroll.x = element;
				}

				if (axes.includes('y') && !elementsScroll.y)
				{
					elementsScroll.y = element;
				}
			}

			element = element.parentElement;
		}

		return elementsScroll;
	}

	/*gererLaMolette = (event) =>
	{
		// Si la molette est utilisée dans une zone de scroll vertical, alors laisser le navigateur gérer le défilement vertical
		if (event.target.closest('[data-scroll="y"]')) return;

		// Faire défiler l'élément horizontalement
		this.element.scrollLeft += event.deltaY;
	}*/
	
	gererLeClic = (event) =>
	{		
		if (!this.clicApresDrag)
		{
			return;
		}
		
		if (event.pointerType === 'mouse')
		{
			event.preventDefault();
			event.stopPropagation();
		}
		else
		{
			event.preventDefault();
		}

		this.clicApresDrag = false;
	}
	
	initialiser = () =>
	{
		this.element.addEventListener('pointerdown', event => this.debutDuGeste(event));
		this.element.addEventListener('pointermove', event => this.gererLeDeplacement(event));
		this.element.addEventListener('pointerup', () => this.reinitialiserGeste(true));
		this.element.addEventListener('pointercancel', () => this.reinitialiserGeste(false));
		this.element.addEventListener('lostpointercapture', () => this.reinitialiserGeste(false));
		window.addEventListener('blur', () => this.reinitialiserGeste(false));
		// this.element.addEventListener('wheel', event => this.gererLaMolette(event)); // ok mais pas confortable
		this.element.addEventListener('click', event => this.gererLeClic(event), true);
	}
}


export { ControlesScroll };
