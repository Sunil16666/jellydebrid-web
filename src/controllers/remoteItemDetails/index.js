// remoteItemDetails/index.js
// import { getBackdropImageUrl } from '../../scripts/dom.js';
// import loading from 'components/loading/loading';
// import ServerConnections from 'jellyfin-apiclient';
// import globalize from '../../scripts/globalize'; // For translating labels if needed
// import itemHelper from '../../components/itemHelper'; // For utility functions

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// Expanded Mock data
const getMockRemoteItemDetails = (provider, id) => {
    console.log(`[RemoteDetails] Fetching mock data for ${provider} - ${id}`);
    return new Promise(resolve => {
        setTimeout(() => {
            if (provider === 'Tmdb' && id === '550') { // Fight Club
                resolve({
                    name: 'Fight Club (Mock)',
                    tagline: 'Mischief. Mayhem. Soap.',
                    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral towards oblivion.',
                    providerIds: { Tmdb: '550' },
                    providerName: 'TMDb',
                    itemType: 'Movie',
                    productionYear: 1999,
                    runtimeMinutes: 139,
                    officialRating: 'R', // MPAA Rating
                    communityRating: 8.4, // e.g., TMDb rating
                    genres: ['Drama', 'Thriller', 'Dark Comedy'],
                    studios: [{ Name: 'Fox 2000 Pictures' }, { Name: 'Regency Enterprises' }],
                    people: [
                        { Name: 'David Fincher', Type: 'Director' },
                        { Name: 'Jim Uhls', Type: 'Writer' },
                        { Name: 'Edward Norton', Type: 'Actor', Role: 'The Narrator' },
                        { Name: 'Brad Pitt', Type: 'Actor', Role: 'Tyler Durden' },
                        { Name: 'Helena Bonham Carter', Type: 'Actor', Role: 'Marla Singer' }
                    ],
                    images: {
                        primary: '/rUPKPWBpr2ZbDXXZpT0qgYqTlG9.jpg', // Poster path
                        backdrop: '/xRyINp9KfMLVjRiO5nCsoRDdvvF.jpg', // Backdrop path
                        logo: '/ayYwAnf7WQoOE7npYuBxat9jfhv.png' // Logo path
                    }
                    // Fields that might be in itemDetails but less relevant for pure remote items (can be placeholders)
                    // For example, local server specific fields:
                    // Id: 'mock-remote-550', // A unique ID for this item in the context of this page
                    // ServerId: 'mock-server',
                    // CanDelete: false,
                    // CanDownload: false,
                    // MediaSources: [], // For track selections, if we ever support them for remote
                });
            } else {
                resolve(null);
            }
        }, 500);
    });
};

function getTmdbImageUrl(path, size = 'w500') { // Default size w500
    if (!path) return '';
    // Path should already start with / if it's a TMDb path, ensure it for robustness
    const imagePath = path.startsWith('/') ? path : `/${path}`;
    return `${TMDB_IMAGE_BASE_URL}${size}${imagePath}`;
}

// --- DOM Rendering Functions ---

function renderName(page, item) {
    // The original itemDetails uses a complex renderName. We'll simplify for now.
    const nameContainer = page.querySelector('.nameContainer');
    if (nameContainer) {
        // Clear existing content (e.g. placeholders)
        nameContainer.innerHTML = '';
        const nameElement = document.createElement('h1');
        nameElement.textContent = item.name || 'Unknown Title';
        nameContainer.appendChild(nameElement);
        // The original also appends original title if different, we can add later.
    }
}

function renderImage(page, item) {
    const imageContainer = page.querySelector('.detailImageContainer');
    if (imageContainer) {
        if (item.images && item.images.primary) {
            const imageUrl = getTmdbImageUrl(item.images.primary, 'w220_and_h330_face');
            imageContainer.innerHTML = `<img src="${imageUrl}" alt="${item.name || 'Poster'}" style="display: block; width: 100%; max-width: 220px; height: auto; border-radius: 8px;" />`;
            imageContainer.style.backgroundColor = 'transparent';
        } else {
            imageContainer.innerHTML = ''; // Or a placeholder
            imageContainer.style.backgroundColor = '#222'; // Dark placeholder
        }
    }
}

function renderBackdrop(page, item) {
    const backdropElement = page.querySelector('#itemBackdrop');
    if (backdropElement) {
        if (item.images && item.images.backdrop) {
            const backdropUrl = getTmdbImageUrl(item.images.backdrop, 'original'); // Use 'original' for backdrop
            backdropElement.style.backgroundImage = `url('${backdropUrl}')`;
            // Standard backdrop styling from itemDetails.scss (selfBackdropPage)
            // might handle opacity, but we can enforce here if needed.
            // backdropElement.style.opacity = 0.3; // Example, adjust as needed
        } else {
            backdropElement.style.backgroundImage = 'none';
        }
    }
}

function renderLogo(page, item) {
    const logoElement = page.querySelector('.detailLogo');
    if (logoElement) {
        if (item.images && item.images.logo) {
            const logoUrl = getTmdbImageUrl(item.images.logo, 'w500'); // Use w500 for logo (constrained by CSS)
            logoElement.innerHTML = `<img src="${logoUrl}" alt="${item.name || ''} Logo" style="max-height: 100px; max-width: 350px; margin-bottom: 1em;" />`;
            logoElement.classList.remove('hide');
        } else {
            logoElement.innerHTML = '';
            logoElement.classList.add('hide');
        }
    }
}

function renderMiscInfoPrimary(page, item) {
    const miscInfoPrimary = page.querySelector('.itemMiscInfo-primary');
    if (miscInfoPrimary) {
        let html = '';
        if (item.productionYear) {
            html += `<span class="itemYear">${item.productionYear}</span>`;
        }
        if (item.runtimeMinutes) {
            // Assuming itemHelper.getDisplayRuntime is available or reimplement
            // For now, simple display:
            const hours = Math.floor(item.runtimeMinutes / 60);
            const minutes = item.runtimeMinutes % 60;
            html += `<span class="itemRuntime" style="margin-left: 10px;">${hours}h ${minutes}m</span>`;
        }
        if (item.officialRating) {
            html += `<span class="itemRating" style="margin-left: 10px;">${item.officialRating}</span>`;
        }
        // Add community rating, etc.
        if (item.communityRating) {
            html += `<span class="itemCommunityRating" style="margin-left: 10px;"><span class="material-icons star" style="font-size: inherit; vertical-align: sub;">star</span> ${item.communityRating.toFixed(1)}</span>`;
        }
        miscInfoPrimary.innerHTML = html;
    }
}

function renderMiscInfoSecondary(page, item) {
    const miscInfoSecondary = page.querySelector('.itemMiscInfo-secondary');
    if (miscInfoSecondary) {
        // For remote items, this might show provider info or other details
        let html = '';
        if (item.providerName) {
            html += `Provider: ${item.providerName}`;
        }
        if (item.itemType) {
            html += ` (${item.itemType})`;
        }
        miscInfoSecondary.innerHTML = html;
        if (html) miscInfoSecondary.classList.remove('hide');
        else miscInfoSecondary.classList.add('hide');
    }
}

function renderTagline(page, item) {
    const taglineElement = page.querySelector('.tagline');
    if (taglineElement) {
        taglineElement.textContent = item.tagline || '';
        if (item.tagline) taglineElement.classList.remove('hide');
        else taglineElement.classList.add('hide');
    }
}

function renderOverview(page, item) {
    const overviewElement = page.querySelector('.overview');
    if (overviewElement) {
        overviewElement.textContent = item.overview || 'No overview available.';
    }
}

function renderGenres(page, item) {
    const genresContainer = page.querySelector('.genresGroup .genres');
    const genresGroup = page.querySelector('.genresGroup');
    const genresLabel = page.querySelector('.genresGroup .genresLabel');

    if (genresContainer && genresGroup && genresLabel) {
        if (item.genres && item.genres.length) {
            // Assuming globalize.translate is available
            genresLabel.textContent = item.genres.length > 1 ? 'Genres' : 'Genre';
            // The original itemDetails uses clickable links. For now, just text.
            genresContainer.innerHTML = item.genres.map(g => `<span style="margin-right: 5px;">${g}</span>`).join(', ');
            genresGroup.classList.remove('hide');
        } else {
            genresGroup.classList.add('hide');
        }
    }
}

function renderPeopleList(page, item, options) {
    const {
        type,
        containerSelector,
        groupSelector,
        labelSelector,
        labelSingular,
        labelPlural
    } = options;

    const container = page.querySelector(containerSelector);
    const group = page.querySelector(groupSelector);
    const labelEl = page.querySelector(labelSelector);

    if (!container || !group || !labelEl) return;

    const people = (item.people || []).filter(p => p.Type === type);
    if (people.length) {
        labelEl.textContent = people.length > 1 ? labelPlural : labelSingular;
        // Original uses clickable links. For now, just text.
        container.innerHTML = people.map(p => {
            let text = p.Name;
            if (p.Role) text += ` (as ${p.Role})`;
            return `<span style="margin-right: 10px;">${text}</span>`;
        }).join(', ');
        group.classList.remove('hide');
    } else {
        group.classList.add('hide');
    }
}

function renderDirectors(page, item) {
    renderPeopleList(page, item, {
        type: 'Director',
        containerSelector: '.directorsGroup .directors',
        groupSelector: '.directorsGroup',
        labelSelector: '.directorsGroup .directorsLabel',
        labelSingular: 'Director',
        labelPlural: 'Directors'
    });
}

function renderWriters(page, item) {
    renderPeopleList(page, item, {
        type: 'Writer',
        containerSelector: '.writersGroup .writers',
        groupSelector: '.writersGroup',
        labelSelector: '.writersGroup .writersLabel',
        labelSingular: 'Writer',
        labelPlural: 'Writers'
    });
}

function renderStudios(page, item) {
    const studiosContainer = page.querySelector('.studiosGroup .studios');
    const studiosGroup = page.querySelector('.studiosGroup');
    const studiosLabel = page.querySelector('.studiosGroup .studiosLabel');

    if (studiosContainer && studiosGroup && studiosLabel) {
        if (item.studios && item.studios.length) {
            studiosLabel.textContent = item.studios.length > 1 ? 'Studios' : 'Studio';
            // Original uses clickable links. For now, just text.
            studiosContainer.innerHTML = item.studios.map(s => `<span style="margin-right: 10px;">${s.Name}</span>`).join(', ');
            studiosGroup.classList.remove('hide');
        } else {
            studiosGroup.classList.add('hide');
        }
    }
}

// Main render function
function renderDetails(page, item) {
    console.log('[RemoteDetailsController] renderDetails for item:', item);
    if (!item) {
        console.error('[RemoteDetailsController] Item data is null, cannot render.');
        // Potentially clear the page or show a more prominent error
        const nameContainer = page.querySelector('.nameContainer');
        if (nameContainer) nameContainer.innerHTML = '<p>Error: Item data not found.</p>';
        return;
    }

    renderBackdrop(page, item);
    renderLogo(page, item);
    renderImage(page, item); // Poster
    renderName(page, item);
    renderMiscInfoPrimary(page, item);
    renderMiscInfoSecondary(page, item);
    renderTagline(page, item);
    renderOverview(page, item);

    // Detail groups
    renderGenres(page, item);
    renderDirectors(page, item);
    renderWriters(page, item);
    renderStudios(page, item);

    // Hide sections for which we don't have data or aren't implementing yet
    // Example: Track selections, recording fields, various collapsible sections
    const trackSelectionsForm = page.querySelector('.trackSelections');
    if (trackSelectionsForm) trackSelectionsForm.classList.add('hide');

    const recordingFields = page.querySelector('.recordingFields');
    if (recordingFields) recordingFields.classList.add('hide');

    // Hide all collapsible sections for now, can be shown as implemented
    page.querySelectorAll('.verticalSection.detailVerticalSection').forEach(el => {
        if (!el.classList.contains('genresGroup')
            && !el.classList.contains('directorsGroup')
            && !el.classList.contains('writersGroup')
            && !el.classList.contains('studiosGroup')) {
            // Check if it's part of the itemDetailsGroup before hiding, or use more specific selectors
            // For simplicity, this might hide more than intended if not careful with class names.
            // A better approach is to explicitly hide sections we are not populating.
        }
    });
    // Explicitly hide sections we are not ready for:
    ['#seriesTimerScheduleSection', '.collectionItems', '.nextUpSection', '.programGuideSection', '#childrenCollapsible', '#additionalPartsCollapsible', '.moreFromSeasonSection', '#lyricsSection', '.moreFromArtistSection', '#castCollapsible', '#guestCastCollapsible', '#seriesScheduleSection', '#specialsCollapsible', '#musicVideosCollapsible', '#scenesCollapsible', '#similarCollapsible'].forEach(selector => {
        const el = page.querySelector(selector);
        if (el) el.classList.add('hide');
    });

    // Buttons - for now, just ensure they are hidden as we don't have actions
    page.querySelectorAll('.mainDetailButtons button').forEach(btn => {
        btn.classList.add('hide');
    });
    // We might want to show a placeholder in .mainDetailButtons if all are hidden.
    const mainButtonsContainer = page.querySelector('.mainDetailButtons');
    if (mainButtonsContainer) mainButtonsContainer.innerHTML = '<p>Action buttons (e.g., Add to Library, Play Trailer) will appear here.</p>';
}

class RemoteItemDetailsController {
    constructor(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = window.ServerConnections?.currentApiClient?.();

        console.log('[RemoteDetailsController] Constructed. View:', view ? view.id : 'undefined');
        console.log('[RemoteDetailsController] Constructed. Params:', params);
        this.loadData();
    }

    async loadData() {
        console.log('[RemoteDetailsController] loadData. View:', this.view ? this.view.id : 'undefined');
        const { provider, id } = this.params;

        if (!this.view) {
            console.error('[RemoteDetailsController] View is not available in loadData.');
            return;
        }
        if (!provider || !id) {
            console.error('[RemoteDetailsController] Missing provider or id.');
            this.view.querySelector('.nameContainer').innerHTML = '<p>Error: Missing provider or ID.</p>';
            return;
        }

        // Use global loading if available
        if (window.loading && typeof window.loading.show === 'function') window.loading.show();

        try {
            const item = await getMockRemoteItemDetails(provider, id);
            if (item) {
                renderDetails(this.view, item);
            } else {
                this.view.querySelector('.nameContainer').innerHTML = `<p>Could not load details for ${provider} ID ${id}.</p>`;
            }
        } catch (error) {
            console.error('[RemoteDetailsController] Error loading data:', error);
            this.view.querySelector('.nameContainer').innerHTML = '<p>Error loading details.</p>';
        } finally {
            if (window.loading && typeof window.loading.hide === 'function') window.loading.hide();
        }
    }

    onResume(options) {
        console.log('[RemoteDetailsController] onResume. Options:', options);
        this.loadData(); // Reload data when view is resumed
    }

    onPause() {
        console.log('[RemoteDetailsController] onPause');
    }

    destroy() {
        console.log('[RemoteDetailsController] destroy');
    }
}

export default RemoteItemDetailsController;
