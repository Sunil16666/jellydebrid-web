// jellydebrid-web/src/controllers/discover.js
// DiscoverTab controller for the custom Discover tab in Jellyfin's web client home
// This controller handles the search input, fetches results from the server, and displays them.

import globalize from 'lib/globalize';
import '../elements/emby-input/emby-input';
import '../apps/stable/features/search/components/searchfields.scss';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import imageLoader from 'components/images/imageLoader';
import libraryBrowser from '../scripts/libraryBrowser';
import * as userSettings from '../scripts/settings/userSettings';

const DEBOUNCE_DELAY_MS = 350;

class DiscoverTab {
    constructor(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = window.ServerConnections?.currentApiClient?.() || null;
        this.lastQuery = '';
        this.savedSortKey = 'discover-sort';
        this.sortQuery = userSettings.loadQuerySettings(this.savedSortKey, {
            SortBy: 'Name',
            SortOrder: 'Ascending'
        });
    }

    onResume() {
        this.view.innerHTML = `
            <div class="padded-left padded-right searchFields">
              <div class="searchFieldsInner flex align-items-center justify-content-center" style="gap: 0.75em;">
                <span class="searchfields-icon material-icons search" aria-hidden="true"></span>
                <div class="inputContainer flex-grow" style="margin-bottom: 0; display: flex; align-items: center;">
                  <input is="emby-input" id="discover-query" class="searchfields-txtSearch"
                         type="text" data-keyboard="true"
                         placeholder="${globalize.translate('Search')}"
                         autocomplete="off" maxlength="40" autofocus
                         style="height: 40px; line-height: 40px;" />
                </div>
                <div class="searchOptions flex align-items-center" style="height: 40px; gap: 0.25em;">
                  <button is="paper-icon-button-light" class="btnSelectView autoSize" title="${globalize.translate('ButtonSelectView')}" style="height: 40px; display: flex; align-items: center;">
                    <span class="material-icons view_comfy" aria-hidden="true"></span>
                  </button>
                  <button is="paper-icon-button-light" class="btnSort autoSize" title="${globalize.translate('Sort')}" style="height: 40px; display: flex; align-items: center;">
                    <span class="material-icons sort_by_alpha" aria-hidden="true"></span>
                  </button>
                  <button is="paper-icon-button-light" class="btnFilter autoSize" title="${globalize.translate('Filter')}" style="height: 40px; display: flex; align-items: center;">
                    <span class="material-icons filter_alt" aria-hidden="true"></span>
                  </button>
                </div>
              </div>
            </div>
            <div id="discover-results" class="padded-left padded-right" style="margin-top:2em;"></div>
        `;

        // Wire up button placeholders
        const input = this.view.querySelector('#discover-query');
        const resultsContainer = this.view.querySelector('#discover-results');
        const btnSelectView = this.view.querySelector('.btnSelectView');
        const btnSort = this.view.querySelector('.btnSort');
        const btnFilter = this.view.querySelector('.btnFilter');

        // Sort menu
        btnSort.addEventListener('click', (e) => {
            const sortItems = [
                { name: globalize.translate('Popularity'), id: 'Popularity' },
                { name: globalize.translate('Name'), id: 'Name' },
                { name: globalize.translate('ProductionYear'), id: 'ProductionYear' },
                { name: globalize.translate('OptionRandom'), id: 'Random' }
            ];
            libraryBrowser.showSortMenu({
                items: sortItems,
                callback: () => {
                    // Persist the updated sortQuery (which is mutated by the sort menu)
                    userSettings.saveQuerySettings(this.savedSortKey, this.sortQuery);
                    if (this.lastQuery.length >= 2) {
                        doSearch(this.lastQuery);
                    }
                },
                query: this.sortQuery,
                button: e.currentTarget
            });
        });

        btnSelectView.addEventListener('click', () => {
            // TODO: implement view selection
        });
        btnFilter.addEventListener('click', () => {
            // TODO: implement filter menu
        });

        // Show a simple default screen if nothing is searched yet
        const renderDefaultScreen = () => {
            resultsContainer.innerHTML = `
                <div class="discover-default-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 320px; padding: 3em 0; color: #888;">
                    <h2 style="font-weight: 600; font-size: 2em; margin-bottom: 0.5em;">${globalize.translate('Discover')}</h2>
                    <div style="font-size: 1.1em; max-width: 400px; text-align: center;">
                        ${globalize.translate('Type a search term above to discover new Movies and Series')}
                    </div>
                </div>
            `;
        };
        renderDefaultScreen();

        // Render a no results screen when no items match the search
        const renderNoResultsScreen = () => {
            resultsContainer.innerHTML = `
                <div class="discover-noresults-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 320px; padding: 3em 0; color: #888;">
                    <h2 style="font-weight: 600; font-size: 2em; margin-bottom: 0.5em;">${globalize.translate('No Results')}</h2>
                    <div style="font-size: 1.1em; max-width: 400px; text-align: center;">
                        ${globalize.translate('No Movies or Series matched your search. Try a different term.')}
                    </div>
                </div>
            `;
        };

        const renderResults = (data) => {
            if (!data) {
                resultsContainer.innerHTML = '<div class="emptyResults">' + globalize.translate('Error') + '</div>';
                return;
            }
            const { Movies = [], Series = [] } = data;
            if ((!Movies || Movies.length === 0) && (!Series || Series.length === 0)) {
                renderNoResultsScreen();
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

        // Helper to apply sortQuery
        const applySort = (items) => {
            return items;
        };

        const doSearch = async (query) => {
            if (!query || query.length < 2) {
                renderDefaultScreen();
                return;
            }
            setLoading(true);
            try {
                const apiClient = ServerConnections.currentApiClient();
                let url = apiClient.getUrl('Discover/Search') + '?query=' + encodeURIComponent(query);
                if (this.sortQuery.SortBy) url += `&sortBy=${encodeURIComponent(this.sortQuery.SortBy)}`;
                if (this.sortQuery.SortOrder) url += `&sortOrder=${encodeURIComponent(this.sortQuery.SortOrder)}`;
                const data = await apiClient.getJSON(url);
                this._lastResults = data;
                data.Movies = applySort(data.Movies || []);
                data.Series = applySort(data.Series || []);
                renderResults(data);
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
            if (this.lastQuery === query) return;
            this.lastQuery = query;
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                doSearch(query);
            }, DEBOUNCE_DELAY_MS);
        });

        // Initial search to populate default view
        doSearch('');
    }
}

export default DiscoverTab;
