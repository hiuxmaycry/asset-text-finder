/* - obtener todos los assets
- por cada asset:
    - obtener todos los version group
    - por cada version group:
        - obtener el latest version del version group (versionGroups[0])
        - para ese version:
            - obtener todas las páginas
            - por cada página obtener el markdown y fijarse si tiene un notebook
            - si el asset tiene alguna página con notebook, incluir el asset+versionGroup en el resultado
- imprimir por pantalla todos los resultados (<asset name> - <versionGroup> - <ga>)
*/

const fetch = require('node-fetch');

regex = /```notebook[^```]+```/gm

const authorization = 'bearer 50daa032-7432-46e1-8e0f-3dcaf394c962';

const headers =  { headers: { authorization } };

const headersWithAcceptMarkdown =  { headers: { authorization, accept: 'text/markdown' } };

const getAssets = 'https://anypoint.mulesoft.com/exchange/api/v2/assets?search=&types=rest-api&domain=&&masterOrganizationId=ab149102-a60a-4839-8842-201941a3e117&offset=0&includeSnapshots=true';

const getAssetUrl = (groupId, assetId) =>
    (`https://anypoint.mulesoft.com/exchange/api/v1/assets/${groupId}/${assetId}?includeSnapshots=true`);

const getAssetPortalUrl = (orgId, groupId, assetId, version) =>
    (`https://anypoint.mulesoft.com/exchange/api/v1/organizations/${orgId}/assets/${groupId}/${assetId}/${version}/portal`);

const getPortalPageUrl = (orgId, groupId, assetId, version, page) =>
    (`https://anypoint.mulesoft.com/exchange/api/v1/organizations/${orgId}/assets/${groupId}/${assetId}/${version}/pages/${page}`);

const results = [];

(async function() {
    const response = await fetch(getAssets, headers);
    const assets = await response.json();
    assets.forEach(async (asset) => {

        let assetResponse = await fetch(getAssetUrl(asset.groupId, asset.assetId), headers);
        assetResponse = await assetResponse.json();
        const versionGroups = assetResponse.versionGroups;
        
        versionGroups.forEach(async (versionGroup) => {
            const latestVersion = versionGroup.versions[0];
            let portalResponse = await fetch(
                getAssetPortalUrl(latestVersion.organization.id, latestVersion.groupId, latestVersion.assetId, latestVersion.version),
                headers
            );
            portalResponse = await portalResponse.json();

            portalResponse.pages.forEach(async (page) => {
                const pageResponse = await fetch(
                    getPortalPageUrl(latestVersion.organization.id, latestVersion.groupId, latestVersion.assetId, latestVersion.version, page.path),
                    headersWithAcceptMarkdown
                );
                markdownPage = await pageResponse.text();
                // console.log('>>>>>>', markdownPage);
                if(markdownPage.includes("```notebook") || markdownPage.includes("``` notebook")) {
                    console.log('>>>>>>',
                        'organizationId:',
                        latestVersion.organization.id, 
                        'groupId:',
                        latestVersion.groupId, 
                        'assetId:',
                        latestVersion.assetId, 
                        'version:',
                        latestVersion.version, 
                        'page:',
                        page.path,
                        );
                    console.log(markdownPage.match(regex));
                }
                
            });
        });
    });
    // console.log(assets);
})()
