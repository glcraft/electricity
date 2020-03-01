# TODO Electricity
## Technique
* [x] Créer classe pour Tab
* [x] Icônes 
  * [x] Nouveau fichiers TS
  * [x] Icons storage : stocker des icônes venant de plugins/modèles
  * [x] Méthode de récupération des icônes
  * [x] Chargement async
  * [x] Element taille prérempli (pour que la ligne ne se redimensionne pas après chargement)
* [ ] Créer classe Action (ex: CopyAction, MoveAction, etc...)
* [ ] Corriger caption bar (Boutons qui dépasse du cadre)
* [x] Fenêtre frameless
  * [x] Bouger la fenêtre avec la souris
  * [x] Boutons de fenêtre à droite
  * [ ] MacOS: Fenêtre style mac (boutons à gauche, cercle coloré)
        voir https://www.electronjs.org/docs/api/frameless-window#alternatives-sur-macos
* [ ] Menu provider
## Fonctionnement de base
* [ ] Fonctions usuelles
  * [ ] Menus
    * [ ] Copier/Couper/Coller
    * [ ] Renommer
    * [ ] Copier le chemin d'accès
      * [ ] Paramètre : quoted comme windows ou non 
    * [ ] Supprimer
      * [ ] Dans la corbeille
      * [ ] Définitivement
    * [ ] Nouveau fichier
      * [ ] Modèles
  * [ ] Rechercher dans le dossier courant
  * [ ] Rechercher récursivement
  * [ ] Informations sur hover fichier/dossier
* [x] Liste dossier dans flèche breadcrumb
  * [x] Icône à gauche de l'item 
* [ ] Drag drop
* [x] Container (Explorer est un type de container)
* [ ] Paramétrages
  * [ ] Container
  * [ ] Cacher les fichiers/dossiers cachés
  * [ ] Montrer les extensions
* [ ] Importer shell Windows (pour les programme comme 7zip, vscode...)
* [x] Chargement icône async
* [x] Colonne dans l'affichage liste
  * [x] Date création
  * [x] Date modification
  * [x] Taille fichier
  * [ ] Changer le style
* [x] Onglets
  * [x] Bouton fermer
  * [x] Menus
    * [x] Fermer
    * [x] Dupliquer
    * [x] Ouvrir dans une nouvelle fenêtre
* [ ] Raccourcis clavier
## Fonctionnalités secondaires à ajouter
* [ ] Accès rapide/bookmark
* [ ] Visionneur de fichier
  * [ ] PDF
  * [ ] Word
  * [ ] Excel
  * [ ] Texte/Code (utiliser Monaco)
* [ ] Entête
* [ ] Pied
  * [ ] Nombres d'éléments
  * [ ] Nombres d'éléments sélectionnés
  * [ ] Taches courantes
    * [ ] Copier/Coller
* [ ] Explorateur particulier
  * [ ] Police d'écriture
  * [ ] Accueil
  * [ ] Liste disque
* [ ] ? Macros
## API
* [ ] Fichier de langue
* [ ] Custom icon (voir [Technique](#technique))