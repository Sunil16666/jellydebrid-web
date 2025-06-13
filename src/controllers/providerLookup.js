// providerLookup.js
// Service to check if an item with a given provider and id exists in the library
// Usage: providerLookup.exists(provider, id) => Promise<boolean>

import { ServerConnections } from 'lib/jellyfin-apiclient';

const providerLookup = {
    /**
     * Checks if an item exists in the library by provider and id.
     * @param {string} provider - The provider name (e.g., 'Tmdb').
     * @param {string} id - The provider id (e.g., TMDb numeric id as string).
     * @returns {Promise<boolean>} - Resolves to true if exists, false otherwise.
     */
    exists(provider, id) {
        const apiClient = ServerConnections.currentApiClient();
        if (!apiClient) {
            return Promise.reject(new Error('No API client available'));
        }
        const userId = apiClient.getCurrentUserId(); // Get current user's ID
        if (!userId) {
            return Promise.reject(new Error('No user ID available'));
        }
        // Build query string for GET
        const url = apiClient.getUrl('Library/ProviderLookup/Exists')
                    + '?provider=' + encodeURIComponent(provider)
                    + '&id=' + encodeURIComponent(id)
                    + '&userId=' + encodeURIComponent(userId); // Add userId to the query
        return apiClient.getJSON(url).then(result => {
            // The API returns a boolean
            return !!result;
        });
    }
};

export default providerLookup;
