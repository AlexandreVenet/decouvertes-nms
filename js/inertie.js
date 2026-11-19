class Inertie
{
	constructor(viewport)
	{
		this.viewport = viewport;

		this.positions = [];
		this.velocite = 0;
		this.maxVelocite = 3;
		this.momentumID = null;
		this.tempsMax = 100;
		this.friction = 0.85;
		this.facteurDeplacement = 20;

		this.element = null;
		this.direction = null;
	}

	definirCible = (element, direction) =>
	{
		this.element = element;
		this.direction = direction;
	}

    creerPosition = (position, temps) =>
    {
		return {
			position,
			time: temps
		};
    }

	obtenirPositionsRecentes = (temps) =>
	{
		return this.positions.filter(position => temps - position.time <= this.tempsMax);
	}
	
	ajouterPosition = (position) =>
	{
		const maintenant = Date.now();

		this.positions = this.obtenirPositionsRecentes(maintenant);

		this.positions.push(this.creerPosition(position, maintenant));
	}

	reinitialiser = () =>
	{
		this.velocite = 0;
		this.momentumID = null;
		this.positions = [];
		this.element = null;
		this.direction = null;
	}

	annuler = () =>
	{
		if (this.momentumID)
		{
			cancelAnimationFrame(this.momentumID);
		}

		this.reinitialiser();
	}
	
	calculerVelocite = () =>
	{
		const maintenant = Date.now();
		const positionsRecentes = this.obtenirPositionsRecentes(maintenant);

		if (positionsRecentes.length < 2)
		{
			this.velocite = 0;
			return;
		}

		const premierePosition = positionsRecentes[0];
		const dernierePosition = positionsRecentes[positionsRecentes.length - 1];

		const deltaPosition = dernierePosition.position - premierePosition.position;

		const deltaTemps = dernierePosition.time - premierePosition.time;

		this.velocite = deltaTemps > 0 ? deltaPosition / deltaTemps : 0;
		
		if (this.velocite > this.maxVelocite)
		{
			this.velocite = this.maxVelocite;
		}
		else if (this.velocite < -this.maxVelocite)
		{
			this.velocite = -this.maxVelocite;
		}
	}
	
	estAuLimite = () =>
	{
		if (!this.element) 
		{
			return true;
		}

		if (this.direction === 'horizontal')
		{
			return (this.element.scrollLeft <= 0 && this.velocite < 0)
			||
			(this.element.scrollLeft >= this.element.scrollWidth - this.element.clientWidth && this.velocite > 0);
		}

		if (this.direction === 'vertical')
		{
			return (this.element.scrollTop <= 0 && this.velocite < 0)
			||
			(this.element.scrollTop >= this.element.scrollHeight - this.element.clientHeight && this.velocite > 0);
		}

		return true;
	}

	scrollAvecInertie = () =>
	{
		if (Math.abs(this.velocite) < 0.01)
		{
			this.reinitialiser();
			return;
		}

		if (!this.element)
		{
			this.reinitialiser();
			return;
		}

		if (this.estAuLimite())
		{
			this.reinitialiser();
			return;
		}

		// Selon la direction choisie, multiplier pour avoir un effet de vitesse
		const vitesse = this.velocite * this.facteurDeplacement;
		if (this.direction === 'horizontal')
		{
			this.element.scrollLeft -= vitesse;
		}

		if (this.direction === 'vertical')
		{
			this.element.scrollTop -= vitesse;
		}

		// Diminution progressive de la vitesse (friction)
		this.velocite *= this.friction; 

		// Relancer l’animation d’inertie à la prochaine frame
		this.momentumID = requestAnimationFrame(this.scrollAvecInertie);
	}
}


export { Inertie };
