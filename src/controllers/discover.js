// jellydebrid-web/src/controllers/discover.js
// DiscoverTab controller for the custom Discover tab in Jellyfin's web client home
// This controller handles the search input, fetches results from the server, and displays them.

import globalize from 'lib/globalize';
import '../elements/emby-input/emby-input';
import '../apps/stable/features/search/components/searchfields.scss';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import imageLoader from 'components/images/imageLoader';

const DEBOUNCE_DELAY_MS = 350;

class DiscoverTab {
    constructor(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = window.ServerConnections?.currentApiClient?.() || null;
        this.lastQuery = '';
    }

    onResume(options) {
        this.view.innerHTML = `
            <div class="padded-left padded-right searchFields">
              <div class="searchFieldsInner flex align-items-center justify-content-center">
                <span class="searchfields-icon material-icons search" aria-hidden="true"></span>
                <div class="inputContainer flex-grow" style="margin-bottom: 0;">
                  <input is="emby-input" id="discover-query" class="searchfields-txtSearch"
                         type="text" data-keyboard="true"
                         placeholder="${globalize.translate('Search')}"
                         autocomplete="off" maxlength="40" autofocus />
                </div>
              </div>
            </div>
            <div id="discover-results" class="padded-left padded-right" style="margin-top:2em;"></div>
        `;
        const input = this.view.querySelector('#discover-query');
        const resultsContainer = this.view.querySelector('#discover-results');

        const renderResults = (data) => {
            if (!data) {
                resultsContainer.innerHTML = '<div class="emptyResults">' + globalize.translate('Error') + '</div>';
                return;
            }
            const { Movies = [], Series = [] } = data;
            if ((!Movies || Movies.length === 0) && (!Series || Series.length === 0)) {
                resultsContainer.innerHTML = '<div class="emptyResults">' + globalize.translate('NoResults') + '</div>';
                return;
            }
            let html = '';
            const apiClient = ServerConnections.currentApiClient();
            // Helper to map remote (TMDb) results to cardBuilder-compatible items
            function mapRemoteItems(items, type) {
                // Only include items with a PrimaryImageTag that is a non-empty string and starts with 'http'
                return items.map(item => ({
                    ...item,
                    Type: type,
                    ImageTags: undefined,
                    Name: item.Name || item.Title,
                    ProductionYear: item.ProductionYear,
                    ServerId: apiClient.serverId(),
                    Id: item.Id,
                    PosterImageUrl: (typeof item.PrimaryImageTag === 'string' && item.PrimaryImageTag.startsWith('http')) ?
                        item.PrimaryImageTag :
                        '../assets/img/default-discover-poster.svg'
                }));
            }
            if (Movies && Movies.length) {
                html += '<div class="verticalSection">';
                html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('Movies') + '</h2>';
                html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap">';
                html += cardBuilder.getCardsHtml({
                    items: mapRemoteItems(Movies, 'Movie'),
                    shape: 'portrait',
                    context: 'discover',
                    showTitle: true,
                    showYear: true,
                    centerText: true,
                    cardLayout: true
                });
                html += '</div></div>';
            }
            if (Series && Series.length) {
                html += '<div class="verticalSection">';
                html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('Series') + '</h2>';
                html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap">';
                html += cardBuilder.getCardsHtml({
                    items: mapRemoteItems(Series, 'Series'),
                    shape: 'portrait',
                    context: 'discover',
                    showTitle: true,
                    showYear: true,
                    centerText: true,
                    cardLayout: true
                });
                html += '</div></div>';
            }
            resultsContainer.innerHTML = html;
            imageLoader.lazyChildren(resultsContainer);
        };

        const setLoading = (isLoading) => {
            if (isLoading) {
                resultsContainer.innerHTML = '<div class="loading">Loading...</div>';
            }
        };

        const doSearch = async (query) => {
            if (!query || query.length < 2) {
                resultsContainer.innerHTML = '';
                return;
            }
            setLoading(true);
            try {
                const apiClient = ServerConnections.currentApiClient();
                const url = apiClient.getUrl('Discover/Search') + '?query=' + encodeURIComponent(query);
                const data = await apiClient.getJSON(url);
                renderResults(data);
            // TODO: Remove Error display in production
            } catch (err) {
                let errorMsg = globalize.translate('Error');
                if (err && err.status) {
                    errorMsg += ` (HTTP ${err.status})`;
                }
                if (err && err.message) {
                    errorMsg += `: ${err.message}`;
                }
                resultsContainer.innerHTML = `<div class="emptyResults">${errorMsg}</div>`;
            } finally {
                setLoading(false);
            }
        };

        let debounceTimeout;
        // Use only one lastQuery
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query === this.lastQuery) return;
            this.lastQuery = query;
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => doSearch(query), DEBOUNCE_DELAY_MS);
        });

        // Patch cardBuilder to use PosterImageUrl if present
        if (!cardBuilder._discoverPatched) {
            const origGetImageUrl = cardBuilder.getImageUrl;
            cardBuilder.getImageUrl = function(item, ...args) {
                if (item.PosterImageUrl) {
                    return item.PosterImageUrl;
                }
                return origGetImageUrl.call(cardBuilder, item, ...args);
            };
            cardBuilder._discoverPatched = true;
        }

        if (options?.autoFocus) {
            if (input) {
                input.focus();
            }
        }
    }
}

export default DiscoverTab;
