import { Curseur } from './curseur.js';
import { ControlesScroll } from './controlesScroll.js';
import { REFERENCES } from './references.js';

class Main
{
	constructor ()
	{
		this.templates = {};
		
		this.listeSystemes;
		this.viewportBienvenue;
		this.viewportFiche;
				
		this.curseur;
		
		this.viewportScrollBienvenue;
		this.viewportScrollFiche ;
		
		this.urlDonneeDemandee;
		this.donnees;
		this.espace_id;
	}
	
	initialiser = async () =>
	{
		document.querySelectorAll('template').forEach(t => this.templates[t.id] = t);
		
		this.listeSystemes = document.querySelector('.liste-systemes');
				
		document.addEventListener('dragstart', this.eviterDragImg);
			
		this.curseur = new Curseur();
		
		this.viewportBienvenue = document.querySelector('.viewport.fond-bienvenue');
		this.viewportScrollBienvenue = new ControlesScroll(this.viewportBienvenue);
		
		await this.creerListeDecouvertes();
		this.listeSystemes.onclick = this.clickListeDecouvertes;
	};
	
	eviterDragImg = (e) =>
	{
		if (e.target.closest('img'))
		{
			e.preventDefault();
		}
	};
		
	creerListeDecouvertes = async () =>
	{
		try 
		{
			const data = await this.chargerJSON(REFERENCES.urls.decouvertes);
			
			const liste = [];
			for (let i = data.decouvertes.length - 1; i >= 0; i--)
			{
				const decouverte = data.decouvertes[i];
				const clone = this.clonerTemplate(this.templates.decouvertes);
				clone.champ('bouton').dataset.donnees = REFERENCES.urls.donnees + decouverte.url;
				clone.champ('numero').textContent = String(i + 1).padStart(2, '0');
				clone.champ('nom').textContent = decouverte.nom;
				liste.push(clone.fragment);
			}
			
			this.listeSystemes.append(...liste);
		}
		catch (error) 
		{
			console.log(error);
		}	
	};
	
	clonerTemplate = (element) =>
	{
		const fragment = element.content.cloneNode(true);
		const champ = this.champDe(fragment);
		return { fragment: fragment, champ: champ };
	};
	
	clickListeDecouvertes = async (e) =>
	{
		e.preventDefault();
		
		const bouton = e.target.closest('[data-donnees]');
		
		if (!bouton) { return; }

		this.urlDonneeDemandee = bouton.dataset.donnees;
		const url = this.urlDonneeDemandee + REFERENCES.urls.json;
		
		try 
		{
			this.donnees = await this.chargerJSON(url);
			await this.creerFiche();
			await this.changerEcran(this.viewportFiche, this.viewportBienvenue, '100vw', '-100vw');
			this.initialiserFiche();
		}
		catch (error) 
		{
			console.log(error);
		}	
	};
	
	creerFiche = async () =>
	{
		const systeme = await this.creerSysteme(this.donnees);
		
		// console.log(Array.from(systeme.children).map(element => element.outerHTML).join(""));
		
		document.body.append(systeme);
		
		this.viewportFiche = document.querySelector('.viewport.fond-fiche');
	};
	
	initialiserFiche = () =>
	{	
		this.viewportScrollFiche = new ControlesScroll(this.viewportFiche);
	};
	
	nettoyer = () =>
	{
		this.viewportFiche.remove();
		this.viewportScrollFiche = null;
		this.urlDonneeDemandee = null;
		this.donnees = null;
		this.espace_id = null;	
	};
	
	boutonRetourClick = async (e) =>
	{
		e.preventDefault();
		await this.changerEcran(this.viewportBienvenue, this.viewportFiche, '-100vw', '100vw');	
		this.nettoyer();
	};
	
	creerSysteme = async () =>
	{
		const clone = this.clonerTemplate(this.templates.fiche);
		
		this.renseignerPointGalactique(clone.champ('pointPoint'), clone.champ('pointOmbre'), clone.champ('pointLiaison'));
		
		clone.champ('nom').textContent = this.donnees.nom;
		
		clone.champ('galaxie').append( this.creerGeneralitesTexte(this.donnees.galaxie, null) );
		
		clone.champ('region').append( this.creerGeneralitesTexte(this.donnees.region, null) );
		
		clone.champ('distanceCentre').append( this.creerGeneralitesTexte(this.donnees.distance_centre + ' ' + REFERENCES.distance_centre.unite_mesure, null) );
		
		this.renseignerClasseSpectraleEtCouleur(clone.champ('classeSpectrale'), clone.champ('couleurEtoile'));
		
		clone.champ('nombreCorps').append( this.creerGeneralitesTexte(this.donnees.composition.length, null) );
		
		clone.champ('particularites').append( this.renseignerParticularites() );
		
		this.espace_id = this.donnees.espace_id;
		
		const espace = REFERENCES.espaces[this.espace_id];
		clone.champ('espace').append( this.creerGeneralitesInfoTexteImage(espace.nom, null, espace.icone_id) );
		
		const race = REFERENCES.races[this.donnees.race_id];
		clone.champ('race').append( this.creerGeneralitesInfoTexteImage(race.nom, null, race.icone_id) );
		
		clone.champ('economie').append( this.creerEconomie() );
		
		clone.champ('conflit').append( this.creerConflit() );		
		
		clone.champ('adresse').append(...this.renseignerAdresse() );
		
		this.renseignerCommentaires(clone.champ('commentaires'));
			
		const listeCorps = [];
		for (const objet of this.donnees.composition) 
		{	
			const corps = await this.creerCorps(objet);
			listeCorps.push(corps);
		}
		clone.champ('fiche').append(...listeCorps);
		
		clone.champ('boutonRetour').onclick = this.boutonRetourClick;
		
		return clone.fragment;
	};
		
	renseignerPointGalactique = (champPoint, champOmbre, champLiaison) =>
	{
		const point = this.donnees.position_galactique.point;
		const ombre_y = this.donnees.position_galactique.ombre_y;
		const coordonnees = 
		{
			point: { cx: point.x, cy: point.y },
			ombre: { cx: point.x, cy: ombre_y },
			liaison: { x1: point.x, y1: point.y, x2: point.x, y2: ombre_y }
		};
		
		this.editerDisque(champPoint, coordonnees.point);
		this.editerDisque(champOmbre, coordonnees.ombre);
		this.editerLigne(champLiaison, coordonnees.liaison);
	};
		
	editerDisque = (champ, coordonnees) =>
	{
		champ.setAttribute('cx', coordonnees.cx);
		champ.setAttribute('cy', coordonnees.cy);
	};
	
	editerLigne = (champ, coordonnees) =>
	{
		champ.setAttribute('x1', coordonnees.x1);
		champ.setAttribute('y1', coordonnees.y1);
		champ.setAttribute('x2', coordonnees.x2);
		champ.setAttribute('y2', coordonnees.y2);
	};
	
	creerGeneralitesTexte = (texte, couleur) =>
	{
		const clone = this.clonerTemplate(this.templates.generalitesTexte);
		const elementTexte = clone.champ('texte');
		elementTexte.textContent = texte;
		let classeCSS = couleur ? couleur : REFERENCES.couleursCSS.normal;
		elementTexte.classList.add(classeCSS);
		return clone.fragment;
	};
		
	creerIcone = (icone_id, nom) =>
	{
		const clone = this.clonerTemplate(this.templates.generalitesIcone);
		this.renseignerImgAttributsIcone(clone.champ('icone'), icone_id, nom);
		return clone.fragment;
	};
		
	creerGeneralitesInfo = (fragments) =>
	{
		const clone = this.clonerTemplate(this.templates.generalitesInfo);
		clone.champ('bloc').append(...fragments);
		return clone.fragment;
	};
	
	creerGeneralitesInfoTexteImage = (nom, couleur, icone_id) =>
	{
		const fragmentTexte = this.creerGeneralitesTexte(nom, couleur);
		const fragmentIcone = this.creerIcone(icone_id, nom);
		const fragmentParent = this.creerGeneralitesInfo([fragmentTexte, fragmentIcone]);
		return fragmentParent;
	};
	
	renseignerClasseSpectraleEtCouleur = (champClasse, champCouleur) =>
	{	
		const classeSpectrale = this.donnees.classe_spectrale;
		
		const lettre = classeSpectrale.classe.charAt(0);
		
		const couleurAttendueId = REFERENCES.classes_spectrales.classes[lettre];
		const couleurAttendue = REFERENCES.classes_spectrales.couleurs[couleurAttendueId];
		const couleurCSSAttendue = REFERENCES.couleursCSS[couleurAttendue.couleur];
		
		champClasse.append( this.creerGeneralitesTexte(classeSpectrale.classe, couleurCSSAttendue) );
		
		let texteCouleurReelle;
		let couleurReelleCSS;
		
		if(classeSpectrale.erreur_couleur && classeSpectrale.erreur_couleur !== lettre)
		{
			const couleurId = REFERENCES.classes_spectrales.classes[classeSpectrale.erreur_couleur];
			const couleurReelle = REFERENCES.classes_spectrales.couleurs[couleurId];
			couleurReelleCSS = REFERENCES.couleursCSS[couleurReelle.couleur];
			texteCouleurReelle = couleurReelle.nom + ' ' + REFERENCES.designations.erreur.nom;
		}
		else
		{
			couleurReelleCSS = couleurCSSAttendue;
			texteCouleurReelle = couleurAttendue.nom;
		}
		
		champCouleur.append( this.creerGeneralitesTexte(texteCouleurReelle, couleurReelleCSS) );
	};
	
	renseignerParticularites = () =>
	{		
		const unCorpsADeLEau = this.donnees.composition.some(corps => 
			corps.icone?.couches?.eau
		);
		
		const unCorpsEstDissonant = this.donnees.composition.some(corps => 
			corps.environnement?.sentinelles_id === REFERENCES.sentinelles_niveaux.corrompues.id
		);

		if(!unCorpsADeLEau && ! unCorpsEstDissonant && !this.donnees.particularites)
		{
			const texteSeul = this.creerGeneralitesTexte(REFERENCES.particularites.aucune.nom, null);
		 	return texteSeul;
		}
		
		const listeInfos = [];
		const ajouterParticularite = (condition, reference) =>
		{
			if(condition)
			{
				listeInfos.push( this.creerGeneralitesInfoTexteImage(reference.nom, REFERENCES.couleursCSS[reference.couleur], reference.icone_id) );
			}
		};
		ajouterParticularite(unCorpsADeLEau, REFERENCES.particularites.eau);
		ajouterParticularite(unCorpsEstDissonant, REFERENCES.particularites.dissonance);
		ajouterParticularite(this.donnees.particularites?.includes(REFERENCES.particularites.atlas.id), REFERENCES.particularites.atlas);
		ajouterParticularite(this.donnees.particularites?.includes(REFERENCES.particularites.trou_noir.id), REFERENCES.particularites.trou_noir);
		
		const clone = this.clonerTemplate(this.templates.generalitesListeInfos);
		clone.champ('liste').append(...listeInfos);
		
		return clone.fragment;
	};
						
	creerGeneralitesPuces = (niveau) =>
	{
		const clone = this.clonerTemplate(this.templates.generalitesInfoPuces);
		
		const spans = clone.champ('puces').querySelectorAll('span');
		for (let i = 0; i < spans.length; i++) 
		{
			let nomClasseCSS = (i+1 <= niveau)?'pleine':'vide';
			spans[i].classList.add(nomClasseCSS);
		}
		
		return clone.fragment;
	};
		
	creerEconomie = () =>
	{
		let fragmentParent;
		
		const creerBlocDonneesIntrouvables = () =>
		{
			const ref = REFERENCES.designations.donnees_introuvables;
			fragmentParent = this.creerGeneralitesInfoTexteImage(ref.nom, null, ref.icone_id);
		};
		
		this.executerSelonEspace({
			reglemente: () => 
			{  
				const ref = REFERENCES.economies[this.donnees.economie.type_id];
				fragmentParent = this.creerGeneralitesInfoTextePucesImage(this.donnees.economie.designation, null, this.donnees.economie.niveau, ref.icone_id);
			},
			pirate: () => 
			{  
				const ref = REFERENCES.economies[this.donnees.economie.type_id];
				fragmentParent = this.creerGeneralitesInfoTexteImage(this.donnees.economie.designation, null, ref.icone_id);
			},
			abandonne: creerBlocDonneesIntrouvables(),
			inexplore: creerBlocDonneesIntrouvables()
		});
		
		return fragmentParent;
	};
	
	creerGeneralitesInfoTextePucesImage = (nom, couleur, niveau, icone_id) =>
	{
		const fragmentTexte = this.creerGeneralitesTexte(nom, couleur);
		const fragmentPuces = this.creerGeneralitesPuces(niveau);
		const fragmentIcone = this.creerIcone(icone_id, nom);
		const fragmentParent =  this.creerGeneralitesInfo([fragmentTexte, fragmentPuces, fragmentIcone]);
		return fragmentParent;
	};
		
	creerConflit = () =>
	{
		let fragmentParent;
		
		const creerBloc = (reference) =>
		{
			fragmentParent = this.creerGeneralitesInfoTexteImage(reference.nom, null, reference.icone_id);
		};
		
		this.executerSelonEspace({
			reglemente: () => 
			{  
				const ref = REFERENCES.conflits.reglemente;
				fragmentParent = this.creerGeneralitesInfoTextePucesImage(this.donnees.conflit.type, null, this.donnees.conflit.niveau, ref.icone_id);
			},
			pirate: creerBloc(REFERENCES.conflits.pirate),
			abandonne: creerBloc(REFERENCES.conflits.abandonne),
			inexplore: creerBloc(REFERENCES.designations.donnees_introuvables)
		});
		
		return fragmentParent;
	};
	
	renseignerAdresse = () =>
	{		
		const listeIcones = [];
		
		for (const lettre of this.donnees.adresse)
		{					
			const glyphe = REFERENCES.glyphes['glyphe_'+lettre];			
			listeIcones.push( this.creerIcone(glyphe.icone_id, glyphe.nom) );
		}
		
		return listeIcones;
	};
	
	renseignerCommentaires = (champListe) =>
	{		
		if(!this.donnees.commentaires)
		{
			champListe.remove();
			return;
		}
		
		const liste = [];
		for (const texte of this.donnees.commentaires) 
		{
			const clone = this.clonerTemplate(this.templates.generalitesCommentaire);
			clone.champ('texte').textContent = texte;
			liste.push(clone.fragment);
		}
		champListe.append(...liste);
	};
	
	creerCorps = async (data) =>
	{			
		const clone = this.clonerTemplate(this.templates.corps);
		
		let stationSpatiale = false;
		let planete = false;
		let lune = false;
		
		if(data.type_id === REFERENCES.corps.station_spatiale.id)
		{
			stationSpatiale = true;			
		}
		else if(data.type_id === REFERENCES.corps.planete.id)
		{
			planete = true;
		}
		else if(data.type_id === REFERENCES.corps.lune.id)
		{
			lune = true;
		}
		
		let icone_id;
		let nom;
		if(stationSpatiale)
		{
			icone_id = REFERENCES.corps.station_spatiale.icone_id;
			nom = REFERENCES.corps.station_spatiale.nom;
		}
		else
		{
			icone_id = data.icone.source_id;
			nom = data.nom;
		}
		
		const iconeUrl = this.obtenirIcone(icone_id);
		const svg = await this.chargerSVG(iconeUrl);
		
		if(!stationSpatiale)
		{
			if(data.icone.echelle)
			{
				svg.style.width = data.icone.echelle;
			}
			if(data.icone.couches)
			{							
				const elementsSvg = 
				{
					cercle: svg.querySelector('.cercle'),
					ondes: svg.querySelector('.ondes'),
					demiCercle: svg.querySelector('.demiCercle'),
					vague: svg.querySelector('.vague'),
					gaz: svg.querySelector('.gaz'),
					dissonance: svg.querySelector('.dissonance')
				};
				
				let configuration = 
				{
					couleurCercle: '',
					couleurDemiCercle: '',
					conserver: []
				};
								
				if(data.icone.couches.terre && data.icone.couches.eau)
				{
					configuration.couleurCercle = data.icone.couches.eau;
					configuration.couleurDemiCercle = data.icone.couches.terre;
					configuration.conserver = [elementsSvg.cercle, elementsSvg.ondes, elementsSvg.demiCercle, elementsSvg.vague];
				}
				else if(data.icone.couches.terre)
				{					
					configuration.couleurCercle = data.icone.couches.terre;
					configuration.conserver = [elementsSvg.cercle];
				}
				else if(data.icone.couches.eau)
				{
					configuration.couleurCercle = data.icone.couches.eau;
					configuration.conserver = [elementsSvg.cercle, elementsSvg.ondes];
				}
				else if(data.icone.couches.gaz)
				{
					configuration.couleurCercle = data.icone.couches.gaz;
					configuration.conserver = [elementsSvg.cercle, elementsSvg.gaz];
				}
								
				if(data.environnement && data.environnement.sentinelles_id === REFERENCES.sentinelles_niveaux.corrompues.id)
				{
					configuration.conserver.push(elementsSvg.dissonance);
				}
				
				this.renseignerSvgAttributFill(elementsSvg.cercle, configuration.couleurCercle);
				this.renseignerSvgAttributFill(elementsSvg.demiCercle, configuration.couleurDemiCercle);
				
				const elementsStylisesSvg = svg.querySelectorAll('[class]');
				for (const element of elementsStylisesSvg) 
				{
					if(!configuration.conserver.includes(element))
					{
						element.remove();
					}
				}
			}
		}
		clone.champ('icone').append(svg);	
		
		let indexValeur = data.index + '.';
		if(lune)
		{
			indexValeur += ' ' + REFERENCES.corps.lune.nom;
		}
		clone.champ('index').textContent = indexValeur;
		
		clone.champ('nom').textContent = nom;
		
		clone.champ('captureBouton').onclick = this.captureBoutonClick;
		this.renseignerImgAttributs(clone.champ('captureImage'), this.urlDonneeDemandee + data.capture, `Image de ${nom}`);
		
		const listeBlocs = [];
		const ajouterBlocGenerique = (data, categorie, bloc) =>
		{
			if(data)
			{
				listeBlocs.push( this.creerBlocGenerique(data, categorie, bloc) );
			}
		};
		const ajouterBlocDedie = (data, callback) =>
		{
			if(data)
			{
				listeBlocs.push( callback(data) );
			}
		};
		if(stationSpatiale)
		{
			listeBlocs.push( this.creerBlocServices(data) );
			ajouterBlocGenerique(data.modules_s_exocombinaison, REFERENCES.modules_s.exocombinaison, REFERENCES.blocs.modules_s_exocombinaison);
			ajouterBlocGenerique(data.modules_s_multioutil, REFERENCES.modules_s.multioutil, REFERENCES.blocs.modules_s_multioutil);
			ajouterBlocGenerique(data.modules_s_exonef, REFERENCES.modules_s.exonef, REFERENCES.blocs.modules_s_exonef);
			ajouterBlocGenerique(data.modules_s_vaisseau, REFERENCES.modules_s.vaisseau, REFERENCES.blocs.modules_s_vaisseau);
		}
		else
		{
			ajouterBlocDedie(data.environnement, this.creerBlocEnvironnement);
			ajouterBlocDedie(data.caracteristiques, this.creerBlocCaracteristiques);
			ajouterBlocGenerique(data.ressources, REFERENCES.ressources, REFERENCES.blocs.ressources);
		}
		ajouterBlocGenerique(data.interets, REFERENCES.interets, REFERENCES.blocs.interets);
		ajouterBlocGenerique(data.commentaires, REFERENCES.commentaires, REFERENCES.blocs.commentaires);
		
		// if(data.special)
		// {
		// 	const special = this.creerBlocSpecial(data.special);		
		// 	listeBlocs.push(...special);
		// }
		
		clone.champ('contenu').append(...listeBlocs);
		
		return clone.fragment;
	};
			
	renseignerSvgAttributFill = (element, couleur) =>
	{
		if(couleur !== '') 
		{
			element.setAttribute('fill', '#' + couleur);	
		}
	};
	
	captureBoutonClick = (e) =>
	{
		e.preventDefault();
		window.open(e.target.closest('img').src, '_blank').focus();
	}
	
	chargerJSON = async (url) =>
	{
        const response = await fetch(url);
        if (!response.ok) 
		{
            throw new Error(`Erreur HTTP ${response.status}`);
        }
				
		try 
		{
			return await response.json();
		} 
		catch 
		{
			throw new Error(`JSON invalide dans ${url}`);
		}
	};
	
	chargerSVG = async (url) =>
	{
	    // Charger le fichier
	    const response = await fetch(url);
	    if (!response.ok) 
		{
	        throw new Error(`Impossible de charger ${url}`);
	    }

	    // Récupérer son contenu texte et le transformer en doc XML
	    const code = await response.text();
	    const parser = new DOMParser();
	    const doc = parser.parseFromString(code, "image/svg+xml");

	    // Vérifier si erreur XML
	    const erreurXML = doc.querySelector("parsererror");
	    if (erreurXML) 
		{
	        throw new Error("Le fichier SVG contient une erreur XML");
	    }

	    // Renvoyer l'élément svg
	    return doc.documentElement;
	};
	
	creerBlocServices = (data) =>
	{						
		const services_station = REFERENCES.services_station[this.espace_id];
		
		const listeInfos = [];
		
		let listeServices;
				
		this.executerSelonEspace({
			reglemente: () => 
				{ 
					const guildeId = services_station.guildes[data.guilde_id];
					const guilde = REFERENCES.services[guildeId];		
					const infoGuilde = this.creerCorpsInfo(guilde.icone_id, guilde.nom, guilde.nom);
					listeInfos.push(infoGuilde);
					
					listeServices = services_station.services;
				},
			pirate: ()=> listeServices = services_station,
			abandonne: ()=> listeServices = services_station
		});
		
		for (const valeur of listeServices) 
		{
			const serviceId = REFERENCES.services[valeur];
			const info = this.creerCorpsInfo(serviceId.icone_id, serviceId.nom, serviceId.nom);
			listeInfos.push(info);
		}
		
		const fragment = this.creerCorpsBlocInfos(REFERENCES.blocs.services.titre, listeInfos);
		
		return fragment;
	};
	
	executerSelonEspace = (objet) =>
	{
		objet[this.espace_id]?.();
	};
	
	creerBlocEnvironnement = (data) =>
	{		
		let references = [];
		
		const refBiome = REFERENCES.biomes[data.biome.id];
		
		const creerRef= (nom, icone) => 
		{
			return {
				nom: nom,	
				icone_id: icone
			};
		};
		
		let refType;
		if(data.biome.type_id && refBiome.types)
		{
			refType = creerRef(refBiome.types[data.biome.type_id], refBiome.icone_id);
		}
		else
		{
			refType = creerRef(REFERENCES.biomes.sansType, refBiome.icone_id);
		}		
		
		let refAspect;
		if(data.biome.aspect_id && refBiome.aAspect && data.biome.aspect_id !== REFERENCES.biomes.aspects.standard.nom)
		{
			refAspect = REFERENCES.biomes.aspects[data.biome.aspect_id];
		}
		else
		{
			refAspect = creerRef(REFERENCES.biomes.aspects.standard.nom, refBiome.icone_id);
		}
		
		references.push
		(
			refBiome,
			refType,
			refAspect,
			REFERENCES.climats_niveaux[data.climat_id],
			REFERENCES.sentinelles_niveaux[data.sentinelles_id],
			REFERENCES.flore_niveaux[data.flore_id],
			REFERENCES.faune_niveaux[data.faune_id],
			REFERENCES.ressources_niveaux[data.ressources_id]	
		);
		
		const listeInfos = [];
		for (const reference of references) 
		{			
			const info = this.creerCorpsInfo(reference.icone_id, reference.nom, reference.nom);
			listeInfos.push(info);
		}
				
		const fragment = this.creerCorpsBlocInfos(REFERENCES.blocs.environnement.titre, listeInfos);
		
		return fragment;
	};
			
	creerBlocCaracteristiques = (data) =>
	{		
		const referencesOrdonnees = 
		[
			REFERENCES.designations.biome,
			REFERENCES.designations.climat,
			REFERENCES.designations.sentinelles,
			REFERENCES.designations.flore,
			REFERENCES.designations.faune,
			REFERENCES.designations.ressources,
		];	
		
		const listeInfos = [];
		
		for (const ref of referencesOrdonnees) 
		{						
			const info = this.creerCorpsInfo(ref.icone_id, ref.nom, data[ref.id]);
			listeInfos.push(info);
		}
				
		const fragment = this.creerCorpsBlocInfos(REFERENCES.blocs.caracteristiques.titre, listeInfos);
		
		return fragment;
	};

	creerBlocGenerique = (data, categorie, bloc) =>
	{		
		const typeTableau = REFERENCES.type_donnees[bloc.type_donnees] // 1, 2 ou 3
				
		const listeInfos = [];
		
		for (const entree of data) 
		{
			let icone;
			let alt;
			let nom;
			
			if(typeTableau === REFERENCES.type_donnees.tableau_ids)
			{
				const ref = categorie[entree];
				icone = ref.icone_id;
				alt = ref.nom;
				nom = ref.nom;
			}
			else if(typeTableau === REFERENCES.type_donnees.tableau_textes)
			{
				icone = categorie.icone_id;
				alt = categorie.nom;
				nom = entree;
			}
			else if(typeTableau === REFERENCES.type_donnees.tableau_objets)
			{
				const [cle, valeur] = Object.entries(entree)[0];
				const ref = categorie[cle];
				icone = ref.icone_id;
				alt = ref.nom;
				nom = valeur;
			}
						
			const info = this.creerCorpsInfo(icone, alt, nom);
			listeInfos.push(info);	
		}
		
		const fragment = this.creerCorpsBlocInfos(bloc.titre, listeInfos);
				
		return fragment;
	};
	
	// creerBlocSpecial = (data) =>
	// {		
	// 	const fragments = [];
		
	// 	for (const element of data) 
	// 	{			
	// 		const listeInfos = [];
	// 		for (const contenu of element.contenu) 
	// 		{
	// 			let donnees;
	// 			if (contenu.type === REFERENCES.special.reference) 
	// 			{
	// 				donnees = REFERENCES[contenu.referentiel]?.[contenu.id];
	// 			}
	// 			else if (contenu.type === REFERENCES.special.libre) 
	// 			{
	// 				donnees = contenu;
	// 			}
	// 			const info = this.creerCorpsInfo(donnees.icone_id, donnees.nom, donnees.nom);
	// 			listeInfos.push(info);
	// 		}
			
	// 		const fragment = this.creerCorpsBlocInfos(element.titre, listeInfos);
	// 		fragments.push(fragment);
	// 	}
		
	// 	return fragments;
	// };
	
	creerCorpsBlocInfos = (titre, infos) =>
	{
		const clone = this.clonerTemplate(this.templates.corpsBlocInfos);
		clone.champ('titre').textContent = titre;
		clone.champ('liste').append(...infos);
		return clone.fragment;
	};
	
	creerCorpsInfo = (iconeId, alt, nom) =>
	{		
		const clone = this.clonerTemplate(this.templates.corpsInfo);
		this.renseignerImgAttributsIcone(clone.champ('icone'), iconeId, alt);
		clone.champ('nom').textContent = nom;
		return clone.fragment;
	};
	
	obtenirIcone = (cle) =>
	{
		return REFERENCES.urls.media + REFERENCES.icones[cle];
	};
		
	renseignerImgAttributs = (element, src, alt) =>
	{
		element.src = src;
		element.alt = alt;
	};
	
	renseignerImgAttributsIcone = (element, iconeId, altTexte) =>
	{
		this.renseignerImgAttributs(element, this.obtenirIcone(iconeId), `Icône ${altTexte}`);
	};
			
	champDe = (fragment) =>
	{
		// Renvoyer une fonction qui encapsule le fragment
		const fonction = (nom) =>
		{
			return fragment.querySelector(`[data-champ="${nom}"]`);	
		};
		return fonction;
	};
	
	changerEcran = (viewportEntrant, viewportSortant, positionDepart, positionArrivee) =>
	{
		return new Promise((resolve) =>
	    {
		    // Afficher le panneau entrant
		    viewportEntrant.classList.remove('invisible');

		    // Le positionner hors écran sans animation
		    viewportEntrant.style.transition = 'none';
		    viewportEntrant.style.transform = `translateX(${positionDepart})`;

		    // Forcer l'application immédiate de la position
		    void viewportEntrant.offsetWidth;

		    // Réactiver les transitions
		    viewportEntrant.style.transition = '';

		    const finTransition = (event) =>
		    {
		        if (event.propertyName !== 'transform') return;
		        if (event.target !== viewportSortant) return;

		        // Le panneau entrant devient interactif
		        viewportEntrant.inert = false;

		        // Masquer le panneau sortant
		        viewportSortant.classList.add('invisible');
		        viewportSortant.inert = true;

		        // Nettoyer les transforms
		        viewportEntrant.style.removeProperty('transform');
		        viewportSortant.style.removeProperty('transform');

				// Supprimer le présent écouteur
		        viewportSortant.removeEventListener('transitionend', finTransition);
				
				resolve();
		    };

		    viewportSortant.addEventListener('transitionend', finTransition);

		    // Animation simultanée
		    requestAnimationFrame(() =>
		    {
		        viewportEntrant.style.transform = 'translateX(0)';
		        viewportSortant.style.transform = `translateX(${positionArrivee})`;
		    });
		});
	};
}

// Démarrage

const main = new Main();
await main.initialiser();
