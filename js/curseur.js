class Curseur
{
	constructor()
	{
		this.pointeurFin = window.matchMedia('(pointer: fine)');

		this.element = document;

		this.elementScroll = null;
		this.enfonce = false;
		this.SEUIL_DEPLACEMENT = 5;
		this.startX = 0;
		this.startY = 0;

		this.initialiser();
	}

	estElementInteractif = (element) =>
	{
		if (element.closest('button, a[href], input, select, textarea, [contenteditable="true"], [role="button"]'))
		{
			return true;
		}

		return false;
	}
	
	estElementScrollable = (element) =>
	{
		if (!element) return false;

		return (element.scrollWidth > element.clientWidth
			||
			element.scrollHeight > element.clientHeight);
	}

	trouverElementScroll = (event) =>
	{
		if (this.enfonce) return; 

		let element = event.target;

		this.elementScroll = null;

		while (element)
		{
			if (element.matches?.('[data-scroll]'))
			{
				if (this.estElementScrollable(element))
				{
					this.elementScroll = element;
					break;
				}
			}

			element = element.parentElement;
		}

		this.actualiser();
	}

	pointerMove = (event) =>
	{
		if (!this.estSouris(event)) return;

		if (event.buttons === 0) return;

		const deltaX = event.clientX - this.startX;
		const deltaY = event.clientY - this.startY;

		if (Math.abs(deltaX) < this.SEUIL_DEPLACEMENT && Math.abs(deltaY) < this.SEUIL_DEPLACEMENT)
		{
			return;
		}

		this.enfonce = true;

		this.actualiser();
	}

	estScrollable = () =>
	{
		if (!this.elementScroll) return false;

		return this.estElementScrollable(this.elementScroll);
	}

	estSouris = (event) =>
	{
		return (event.pointerType === 'mouse' && this.pointeurFin.matches);
	}

	actualiser = () =>
	{
		document.body.classList.remove('curseur-grab','curseur-grabbing');

		if (this.pointeurFin.matches && this.estScrollable())
		{
			document.body.classList.add(this.enfonce ? 'curseur-grabbing' : 'curseur-grab');
		}
	}
	
	pointerDown = (event) =>
	{
		if (!this.estSouris(event)) return;

		if (!this.estScrollable()) return; 

		this.startX = event.clientX;
		this.startY = event.clientY;

		if (event.target.closest('button')) return;

		this.enfonce = true;

		this.actualiser();
	}

	pointerUp = (event) =>
	{
		if (!this.estSouris(event)) return;

		this.enfonce = false;

		this.trouverElementScroll(event);

		this.actualiser();
	}

	pointerCancel = (event) =>
	{
		if (!this.estSouris(event)) return;

		this.enfonce = false;

		this.actualiser();
	}

	blur = () =>
	{
		this.enfonce = false;

		this.actualiser();
	}

	pointerOut = (event) =>
	{
		if (!this.estSouris(event)) return;

		if (this.enfonce) return;

		const elementScroll = event.target.closest('[data-scroll]');

		if (elementScroll && elementScroll.contains(event.relatedTarget))
		{
			return;
		}

		this.elementScroll = null;

		this.actualiser();
	}

	initialiser = () =>
	{
		this.pointeurFin.addEventListener('change', () => this.actualiser());
		this.element.addEventListener('pointermove', event => this.trouverElementScroll(event));
		this.element.addEventListener('pointermove', event => this.pointerMove(event));
		this.element.addEventListener('pointerdown', event => this.pointerDown(event));
		this.element.addEventListener('pointerup', event => this.pointerUp(event));
		this.element.addEventListener('pointercancel', event => this.pointerCancel(event));
		window.addEventListener('blur', () => this.blur());
		this.element.addEventListener('pointerout', event => this.pointerOut(event));
	}
}


export { Curseur };
