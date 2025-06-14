// remoteItemDetails/index.js
// This file is an adaptation of the original itemDetails/index.js, modified to work with mock remote data.
import { ServerConnections } from 'lib/jellyfin-apiclient'; // Changed import
import loading from '../../components/loading/loading';
import globalize from 'lib/globalize';
import itemHelper from '../../components/itemHelper'; // For getDisplayRuntime

const TMDB_IMAGE_BASE_URL_W500 = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMAGE_BASE_URL_W1280 = 'https://image.tmdb.org/t/p/w1280';
const TMDB_IMAGE_BASE_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// Utility to escape HTML
function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return unsafe
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getMovieId(params) {
    return params.id;
}

function renderPrimaryDetails(page, movie) {
    // Name / Title
    const nameContainer = page.querySelector('.nameContainer h1 bdi');
    if (nameContainer) {
        nameContainer.textContent = movie.Title || '';
    }
    const originalTitleContainer = page.querySelector('.nameContainer .secondaryName');
    if (originalTitleContainer) {
        if (movie.OriginalTitle && movie.OriginalTitle !== movie.Title) {
            originalTitleContainer.textContent = movie.OriginalTitle;
            originalTitleContainer.classList.remove('hide');
        } else {
            originalTitleContainer.classList.add('hide');
        }
    }

    // Overview
    const overviewElement = page.querySelector('.overview bdi');
    if (overviewElement) {
        overviewElement.innerHTML = movie.Overview ? `<p>${escapeHtml(movie.Overview)}</p>` : '';
    }

    // Tagline
    const taglineElement = page.querySelector('.tagline bdi');
    if (taglineElement) {
        taglineElement.textContent = movie.Tagline || '';
        if (!movie.Tagline) {
            page.querySelector('.tagline').classList.add('hide');
        } else {
            page.querySelector('.tagline').classList.remove('hide');
        }
    }

    // Genres (now in itemDetailsGroup)
    const genresGroup = page.querySelector('.genresGroup');
    if (genresGroup) {
        const genresLabel = genresGroup.querySelector('.genresLabel');
        const genresContent = genresGroup.querySelector('.genres.content');
        if (movie.Genres && movie.Genres.length) {
            if (genresLabel) genresLabel.textContent = globalize.translate('Genres');
            if (genresContent) genresContent.innerHTML = movie.Genres.map(g => `<a class="itemGenreButton" href="#">${escapeHtml(g.Name)}</a>`).join('');
            genresGroup.classList.remove('hide');
        } else {
            genresGroup.classList.add('hide');
        }
    }

    // Release Date, Runtime (Misc Info Primary)
    const miscInfoPrimary = page.querySelector('.itemMiscInfo-primary');
    if (miscInfoPrimary) {
        let html = '';
        if (movie.ReleaseDate) { // Changed to movie.ReleaseDate
            const year = movie.ReleaseDate.split('-')[0]; // Changed to movie.ReleaseDate
            html += `<span>${year}</span>`;
        }
        if (movie.Runtime) { // Changed to movie.Runtime
            html += `<span>${itemHelper.getDisplayRuntime(movie.Runtime * 60 * 1000)}</span>`; // Changed to movie.Runtime
        }
        miscInfoPrimary.innerHTML = html;
    }

    // Directors, Writers (Misc Info Secondary) - Now in itemDetailsGroup
    const directorsGroup = page.querySelector('.directorsGroup');
    if (directorsGroup) {
        const directorsLabel = directorsGroup.querySelector('.directorsLabel');
        const directorsContent = directorsGroup.querySelector('.directors.content');
        if (movie.Directors && movie.Directors.length) {
            if (directorsLabel) directorsLabel.textContent = globalize.translate('Directors');
            if (directorsContent) directorsContent.innerHTML = movie.Directors.map(d => `<a href="#">${escapeHtml(d.Name)}</a>`).join(', ');
            directorsGroup.classList.remove('hide');
        } else {
            directorsGroup.classList.add('hide');
        }
    }

    const writersGroup = page.querySelector('.writersGroup');
    if (writersGroup) {
        const writersLabel = writersGroup.querySelector('.writersLabel');
        const writersContent = writersGroup.querySelector('.writers.content');
        if (movie.Writers && movie.Writers.length) {
            if (writersLabel) writersLabel.textContent = globalize.translate('Writers');
            if (writersContent) writersContent.innerHTML = movie.Writers.map(w => `<a href="#">${escapeHtml(w.Name)}</a>`).join(', ');
            writersGroup.classList.remove('hide');
        } else {
            writersGroup.classList.add('hide');
        }
    }

    // Poster Image
    const posterImageContainer = page.querySelector('.detailImageContainer .cardImageContainer.coveredImage');
    if (posterImageContainer) {
        if (movie.PosterPath) {
            const imageUrl = `${TMDB_IMAGE_BASE_URL_W500}${movie.PosterPath}`;
            posterImageContainer.style.backgroundImage = `url('${imageUrl}')`;
            posterImageContainer.classList.add('lazy'); // For potential lazy loading CSS
        } else {
            // Show a placeholder if no poster
            posterImageContainer.innerHTML = '<div class="cardImageIcon material-icons movie" style="font-size: 5em; text-align: center; padding: 20px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"></div>';
            posterImageContainer.style.backgroundImage = ''; // Clear any previous image
        }
    }
}

function renderBackdropAndLogo(page, movie) {
    const itemBackdrop = page.querySelector('#itemBackdrop');
    if (itemBackdrop) {
        if (movie.BackdropPath) {
            const backdropUrl = `${TMDB_IMAGE_BASE_URL_W1280}${movie.BackdropPath}`;
            itemBackdrop.style.backgroundImage = `url('${backdropUrl}')`;
            itemBackdrop.classList.remove('hide');
        } else {
            itemBackdrop.style.backgroundImage = 'none';
            itemBackdrop.classList.add('hide');
        }
    }

    const detailLogo = page.querySelector('.detailLogo');
    if (detailLogo) {
        if (movie.LogoPath) { // Assuming DTO might have LogoPath
            const logoUrl = `${TMDB_IMAGE_BASE_URL_ORIGINAL}${movie.LogoPath}`;
            detailLogo.style.backgroundImage = `url('${logoUrl}')`;
            // The HTML already has lazy classes, so just ensure it's visible
            detailLogo.classList.remove('hide');
        } else {
            detailLogo.style.backgroundImage = 'none';
            detailLogo.classList.add('hide');
        }
    }
}

function renderCast(page, movie) {
    const castContent = page.querySelector('#castCollapsible .scrollSlider'); // Adjusted selector for new structure
    const castCollapsible = page.querySelector('#castCollapsible');

    if (!castContent || !castCollapsible) return;

    const castMembers = movie.Credits ? movie.Credits.Cast : [];

    if (castMembers && castMembers.length > 0) {
        const html = castMembers.slice(0, 20).map(person => {
            const imageUrl = person.ProfilePath ? `${TMDB_IMAGE_BASE_URL_W500}${person.ProfilePath}` : null;
            return `
                <div class="card personCard" data-id="${person.Id}" data-type="Person">
                    <div class="cardBox visualCardBox">
                        <div class="cardScalable">
                            <div class="cardPadder cardPadder-person"></div>
                            <div class="cardContent">
                                ${imageUrl ? `<img src="${imageUrl}" class="cardImage" loading="lazy" alt="${escapeHtml(person.Name)}"/>` : '<div class="cardImage cardImageIcon material-icons person" aria-hidden="true"></div>'}
                            </div>
                        </div>
                        <div class="cardFooter">
                            <div class="cardText">${escapeHtml(person.Name)}</div>
                            <div class="cardText cardText-secondary">${escapeHtml(person.Character)}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        castContent.innerHTML = html;
        // peopleHeader text is set in HTML by ${HeaderCastAndCrew}
        castCollapsible.classList.remove('hide');
    } else {
        castCollapsible.classList.add('hide');
    }
}

function renderRecommendations(page, movie) {
    const similarContent = page.querySelector('#similarCollapsible .scrollSlider.similarContent'); // Adjusted selector
    const similarCollapsible = page.querySelector('#similarCollapsible');

    if (!similarContent || !similarCollapsible) return;

    const recommendations = movie.Recommendations ? movie.Recommendations.Results : [];

    if (recommendations && recommendations.length > 0) {
        const html = recommendations.slice(0, 10).map(rec => {
            const imageUrl = rec.PosterPath ? `${TMDB_IMAGE_BASE_URL_W500}${rec.PosterPath}` : null;
            const linkUrl = `#!/remoteitemdetails.html?id=${rec.Id}&type=movie`; // Ensure type is passed if needed
            return `
                <a href="${linkUrl}" class="card backdropCard" data-id="${rec.Id}" data-type="Movie">
                    <div class="cardBox visualCardBox">
                        <div class="cardScalable">
                            <div class="cardPadder cardPadder-backdrop"></div>
                            <div class="cardContent">
                                 ${imageUrl ? `<img src="${imageUrl}" class="cardImage" loading="lazy" alt="${escapeHtml(rec.Title)}"/>` : '<div class="cardImage cardImageIcon material-icons movie" aria-hidden="true"></div>'}
                            </div>
                        </div>
                        <div class="cardFooter">
                            <div class="cardText">${escapeHtml(rec.Title)}</div>
                            ${rec.ReleaseDate ? `<div class="cardText cardText-secondary">${rec.ReleaseDate.split('-')[0]}</div>` : ''}
                        </div>
                    </div>
                </a>
            `;
        }).join('');
        similarContent.innerHTML = html;
        similarCollapsible.classList.remove('hide');
    } else {
        similarCollapsible.classList.add('hide');
    }
}

function renderCollectionInfo(page, movie) {
    const collectionSection = page.querySelector('.collectionItems.verticalSection'); // Target the main section
    if (!collectionSection) return;

    const collection = movie.BelongsToCollection;

    if (collection) {
        const collectionItemsContainer = collectionSection.querySelector('.scrollSlider.itemsContainer');
        if (!collectionItemsContainer) return;

        let html = '';
        // The H2 title is already in the HTML: <h2 class="sectionTitle sectionTitle-cards padded-right">${HeaderCollection}</h2>
        // We just need to build the card itself
        const imagePath = collection.PosterPath || collection.BackdropPath;
        const imageUrl = imagePath ? `${TMDB_IMAGE_BASE_URL_W500}${imagePath}` : null;

        html += `<div class="card backdropCard" data-id="${collection.Id}" data-type="BoxSet">`; // Assuming BoxSet type for collections
        html += '<div class="cardBox visualCardBox">';
        html += '<div class="cardScalable">';
        html += '<div class="cardPadder cardPadder-backdrop"></div>';
        html += '<div class="cardContent">';
        if (imageUrl) {
            html += `<img src="${imageUrl}" class="cardImage" loading="lazy" alt="${escapeHtml(collection.Name)}"/>`;
        } else {
            html += '<div class="cardImage cardImageIcon material-icons collections" aria-hidden="true"></div>';
        }
        html += '</div></div>';
        html += `<div class="cardFooter"><div class="cardText">${escapeHtml(collection.Name)}</div></div>`;
        html += '</div>'; // Closing cardBox
        html += '</div>'; // Closing card

        collectionItemsContainer.innerHTML = html;
        collectionSection.classList.remove('hide');
    } else {
        collectionSection.classList.add('hide');
    }
}

function renderStudios(page, movie) {
    const studiosGroup = page.querySelector('.studiosGroup');
    if (!studiosGroup) return;

    const companies = movie.ProductionCompanies;
    if (companies && companies.length > 0) {
        const studiosLabel = studiosGroup.querySelector('.studiosLabel.label');
        const studiosContent = studiosGroup.querySelector('.studios.content');

        if (studiosLabel) studiosLabel.textContent = globalize.translate('Studios'); // Or 'ProductionStudios'
        if (studiosContent) {
            studiosContent.innerHTML = companies.map(s => `<a href="#">${escapeHtml(s.Name)}</a>`).join(', ');
        }
        studiosGroup.classList.remove('hide');
    } else {
        studiosGroup.classList.add('hide');
    }
}

function setupTrailerButton(page, movie) {
    const btnPlayTrailer = page.querySelector('.btnPlayTrailer');
    if (!btnPlayTrailer) return;

    let trailerVideo = null;
    if (movie.Videos && movie.Videos.Results) {
        trailerVideo = movie.Videos.Results.find(v => v.Site === 'YouTube' && v.Type === 'Trailer');
    }

    if (trailerVideo && trailerVideo.Key) { // Check trailerVideo.Key
        btnPlayTrailer.classList.remove('hide');
        btnPlayTrailer.onclick = () => {
            // It's better to use the official YouTube embed or a library if possible,
            // but for simplicity, window.open is used here.
            window.open(`https://www.youtube.com/watch?v=${trailerVideo.Key}`, '_blank');
        };
    } else {
        btnPlayTrailer.classList.add('hide');
    }
}

function hideUnavailableButtons(page) {
    // Hide buttons not applicable to remote items by default
    // Specific logic in other render functions will show them if data exists (e.g. trailer)
    const buttonsToAlwaysHide = [
        '.btnPlay', // Play/Resume will depend on if it can be played (future feature)
        '.btnReplay',
        '.btnDownload',
        '.btnInstantMix',
        '.btnShuffle',
        '.btnCancelSeriesTimer',
        '.btnCancelTimer',
        '.btnPlaystate',
        '.btnUserRating', // Rating might be possible with different backend
        '.btnSplitVersions'
        // '.btnMoreCommands' // Keep this, might have "Identify" or other relevant actions later
    ];
    buttonsToAlwaysHide.forEach(selector => {
        const btn = page.querySelector(selector);
        if (btn) btn.classList.add('hide');
    });

    // Show trailer and more commands button by default, their specific render functions will hide if no data
    const btnTrailer = page.querySelector('.btnPlayTrailer');
    if (btnTrailer) btnTrailer.classList.remove('hide'); // setupTrailerButton will hide if no trailer

    const btnMore = page.querySelector('.btnMoreCommands');
    if (btnMore) btnMore.classList.remove('hide');

    // Hide sections that are typically for library items or not yet supported for remote
    const sectionsToHide = [
        '.trackSelections', // No versions/tracks for remote TMDB items
        '.recordingFields',
        '#seriesTimerScheduleSection',
        '.nextUpSection', // No next up for non-library
        '.programGuideSection',
        '#additionalPartsCollapsible',
        '.moreFromSeasonSection',
        '#lyricsSection',
        '.moreFromArtistSection',
        '#seriesScheduleSection',
        '#specialsCollapsible', // Could be shown if TMDb provides this data and DTO supports
        '#musicVideosCollapsible', // "
        '#scenesCollapsible', // "
        '#guestCastCollapsible' // Guest cast is part of main cast from TMDb, not separate
    ];
    sectionsToHide.forEach(selector => {
        const section = page.querySelector(selector);
        if (section) section.classList.add('hide');
    });
}

// Make sure to adjust the main function if movie.title was used for document.title
export default function (view, params) {
    const page = view;
    const movieId = getMovieId(params);
    const currentApiClient = ServerConnections.currentApiClient();

    console.log('[RemoteDetails] Initializing for movieId:', movieId, 'Params:', params);

    hideUnavailableButtons(page);

    if (movieId && currentApiClient) {
        loading.show();
        console.log(`[RemoteDetails] Fetching data for movieId: ${movieId}`);
        currentApiClient.getJSON(currentApiClient.getUrl(`/ExternalMetadata/Movie?movieId=${movieId}`)).then(movie => {
            console.log('[RemoteDetails] Movie data received:', JSON.parse(JSON.stringify(movie)));

            document.title = movie.Title ? movie.Title + ' - ' + globalize.translate('Details') : globalize.translate('Details'); // Changed to movie.Title

            console.log('[RemoteDetails] Calling renderBackdropAndLogo');
            renderBackdropAndLogo(page, movie);
            console.log('[RemoteDetails] Calling renderPrimaryDetails');
            renderPrimaryDetails(page, movie);
            console.log('[RemoteDetails] Calling renderCast');
            renderCast(page, movie);
            console.log('[RemoteDetails] Calling renderRecommendations');
            renderRecommendations(page, movie);
            console.log('[RemoteDetails] Calling renderCollectionInfo');
            renderCollectionInfo(page, movie);
            console.log('[RemoteDetails] Calling renderStudios');
            renderStudios(page, movie);
            console.log('[RemoteDetails] Calling setupTrailerButton');
            setupTrailerButton(page, movie);

            loading.hide();
        }).catch(error => {
            loading.hide();
            console.error('[RemoteDetails] Failed to load remote item details for ID: ' + movieId, error); // Log error
            const nameContainer = page.querySelector('.nameContainer');
            if (nameContainer) {
                nameContainer.innerHTML = `<h1>${globalize.translate('ErrorLoadingData')}</h1><p>${escapeHtml(error.message || 'Unknown error')}</p>`;
            }
            document.title = globalize.translate('Error');
        });
    } else {
        loading.hide(); // Ensure loading is hidden
        const nameContainer = page.querySelector('.nameContainer');
        let errorMessage = globalize.translate('Error');
        if (!movieId) {
            console.error('No movie ID provided for remote item details page.');
            if (nameContainer) {
                nameContainer.innerHTML = `<h1>${globalize.translate('ErrorNoId')}</h1>`;
            }
        } else if (!currentApiClient) {
            console.error('API client is not available.');
            if (nameContainer) {
                nameContainer.innerHTML = `<h1>${globalize.translate('ErrorApiClientNotAvailable')}</h1>`;
            }
            errorMessage = globalize.translate('ErrorApiClientNotAvailable');
        }
        document.title = errorMessage;
    }

    view.addEventListener('viewdestroy', () => {
        // Cleanup logic if any event listeners were added directly
    });
}
