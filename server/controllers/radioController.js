import axios from 'axios';

const getJioSaavnApi = () => process.env.JIOSAAVN_API_URL;

// Proxy wrapper utility to keep code clean
const proxyRequest = async (res, next, url) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Proxy Error on URL:", url, error?.message);
        next(error);
    }
};

export const getFeaturedStations = async (req, res, next) => {
    const { language = 'hindi' } = req.query;
    const url = `${getJioSaavnApi()}?__call=webradio.getFeaturedStations&api_version=4&_format=json&_marker=0&ctx=web6dot0&languages=${language}`;
    await proxyRequest(res, next, url);
};

export const getArtistsRadios = async (req, res, next) => {
    const url = `${getJioSaavnApi()}?__call=social.getTopArtists&api_version=4&_format=json&_marker=0&ctx=web6dot0`;
    await proxyRequest(res, next, url);
};

export const createFeaturedStation = async (req, res, next) => {
    const { language = 'hindi', id, name } = req.query;
    const queryName = id || name; 
    const url = `${getJioSaavnApi()}?language=${language}&query=&name=${encodeURIComponent(queryName)}&mode=&artistid=&api_version=4&_format=json&_marker=0&ctx=web6dot0&__call=webradio.createFeaturedStation`;
    await proxyRequest(res, next, url);
};

export const createArtistStation = async (req, res, next) => {
    const { id } = req.query;
    const url = `${getJioSaavnApi()}?language=hindi&pid=&query=${encodeURIComponent(id)}&name=${encodeURIComponent(id)}&mode=&artistid=&api_version=4&_format=json&_marker=0&ctx=wap6dot0&__call=webradio.createArtistStation`;
    await proxyRequest(res, next, url);
};

export const getStationSongs = async (req, res, next) => {
    const { stationid, limit = 20, next: nextPage = 1 } = req.query;
    if (!stationid) {
        return res.status(400).json({ error: "stationid is required" });
    }
    const url = `${getJioSaavnApi()}?__call=webradio.getSong&stationid=${stationid}&k=${limit}&next=${nextPage}&api_version=4&_format=json&_marker=0&ctx=web6dot0`;
    await proxyRequest(res, next, url);
};

export const getTrending = async (req, res, next) => {
    const { language = 'hindi' } = req.query;
    const url = `${getJioSaavnApi()}?__call=content.getTrending&api_version=4&_format=json&_marker=0&ctx=web6dot0&entity_type=song&entity_language=${language}`;
    await proxyRequest(res, next, url);
};

export const getSearchStarring = async (req, res, next) => {
    const { language = 'hindi' } = req.query;
    const url = `${getJioSaavnApi()}?p=1&q=${language}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=150&__call=search.getResults`;
    await proxyRequest(res, next, url);
};

export const getLabelData = async (req, res, next) => {
    const { 
        token, 
        p = 0, 
        category = 'popularity', 
        sort_order = 'desc', 
        language = 'hindi',
        n_song = 1,
        n_album = 1
    } = req.query;

    if (!token) return res.status(400).json({ error: "token is required" });
    const url = `${getJioSaavnApi()}?__call=webapi.get&token=${encodeURIComponent(token)}&type=label&p=${p}&n_song=${n_song}&n_album=${n_album}&category=${category}&sort_order=${sort_order}&language=${language}&includeMetaTags=0&ctx=wap6dot0&api_version=4&_format=json&_marker=0`;
    await proxyRequest(res, next, url);
};
