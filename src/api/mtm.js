import moment from 'moment';
import axios from 'axios';
import Song from '../entities/Song.js';
import SongRank from '../entities/SongRank.js';
import MediaItem from '../entities/MediaItem.js';
import ChartPosition from '../entities/ChartPosition.js';

const BASE_URL = "http://localhost:8888/api";

export default class MusicAPI {

  constructor() { }

  /**
   * Handles errors in request
   */
  static handleError = (error) => {
    var message = "Unreachable server error";
    if (error.response.data.errors[0] != undefined) {
      message = error.response.data.errors[0].details;
    }

    throw new Error(message);
  };

  /**
   * Get songs in the billboard chart in a given date
   */

  static getChart = (date) => {

    let query = `SELECT DISTINCT ?position ?name ?id ?name1 
    WHERE {
      ?Chart a schema:MusicPlaylist;
        schema:datePublished "${date}";
        schema:track ?ListItem0.
      ?ListItem0 a schema:ListItem;
        schema:item ?Song;
        schema:position ?position.
      ?Song a schema:MusicRecording;
        schema:name ?name;
        schema:byArtist ?Artist;
        billboard:id ?id.
      ?Artist a schema:MusicGroup;
        schema:name ?name1
    }`;
    let LRA_URL = "http://localhost:9000/api/lra/query?q=" + encodeURIComponent(query);
    
    return axios.get(LRA_URL)
      .then(function (res) {

        let result = res.data.table.rows;
        let chart = [];

        result.forEach((chartItem) => {
          chart.push(new ChartPosition(chartItem['?position'], chartItem['?id'], chartItem['?name'], chartItem['?name1']));
        });

        return chart;
      })
      .catch(function (error) {
        MusicAPI.handleError(error);
      });
  };


  /**
   * Get song information given an id
   */
  static getSongInfo = (id) => {

    let query = `SELECT DISTINCT ?name ?duration ?url ?name1 ?name2 ?albumRelease ?image 
    WHERE {
      ?Song a schema:MusicRecording;
        schema:name ?name;
        schema:byArtist ?MusicGroup;
        schema:inAlbum ?Album;
        schema:duration ?duration;
        schema:url ?url;
        billboard:id "${id}".
      ?MusicGroup a schema:MusicGroup;
        schema:name ?name1.
      ?Album a schema:MusicAlbum;
        schema:name ?name2;
        schema:albumRelease ?albumRelease;
        schema:image ?image
    }`;
    let LRA_URL = "http://localhost:9000/api/lra/query?q=" + encodeURIComponent(query);

    return axios.get(LRA_URL).then(function(response) {
      let result = response.data.table.rows;

      let song = new Song(result['?id'], result['?name'], result['?name1'], result['?name2'], result['?albumRelease'], result['?duration'], result['?url'], result['?image']);
      return song
    })
    .catch(function(error){
        MusicAPI.handleError(error)
    });
  }

  /**
   * Get historical ranks of a song given an id
   */
  static getSongRankings = (id) => {
    let query = `SELECT DISTINCT ?datePublished ?position 
    WHERE {
      ?MusicPlaylist a schema:MusicPlaylist;
        schema:track ?ListItem0;
        schema:datePublished ?datePublished.
      ?ListItem0 a schema:ListItem;
        schema:item ?MusicRecording;
        schema:position ?position.
      ?MusicRecording a schema:MusicRecording;
        billboard:id "${id}"
    }`;

    let LRA_URL = "http://localhost:9000/api/lra/query?q=" + encodeURIComponent(query);

    return axios.get(LRA_URL)
      .then(function (res) {
        let result = res.data.table.rows;
        let rankings = [];

        result.forEach((ranking) => {
          rankings.push(new SongRank(ranking['?datePublished'], ranking['?position']));
        });

        return rankings;
      })
      .catch(function (error) {
        MusicAPI.handleError(error);
      });
  }

  /**
   * Get related media of a song given an id.
   */
  static getSongMedia = (id) => {
    let query = `SELECT DISTINCT ?url ?name ?image 
    WHERE {
      ?MusicRecording a schema:MusicRecording;
        schema:subjectOf ?MediaObject;
        billboard:id "${id}".
      ?MediaObject a schema:MediaObject;
        schema:url ?url;
        schema:name ?name;
        schema:image ?image
    }`;

    let LRA_URL = "http://localhost:9000/api/lra/query?q=" + encodeURIComponent(query);

    return axios.get(LRA_URL).then(function(response) {
      let result = response.data.table.rows;
      let media = [];

      result.forEach((mediaObj) => { 
        media.push(new MediaObject(mediaObj['?url'], mediaObj['?name'], mediaObj['?image']));
      });

      return media;
    })
    .catch(function(error){
        MusicAPI.handleError(error)
    });
  }
}
