import React from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { PlayerProvider } from "./context/PlayerContext";
import { LikedSongsProvider } from "./hooks/useLikedSongs.jsx";
import { PlaylistProvider } from "./context/PlaylistContext";
import PlayerBar from "./components/PlayerBar";
import Playlist from "./components/Playlist";
import PlaylistDetails from "./components/PlaylistDetails";
import Artists from "./components/Artists";
import ArtistsDetails from "./components/ArtistsDetails";
import Download from "./components/Download";
import Home from "./components/Home";
import AlbumDetails from "./components/AlbumDetails";
import Album from "./components/Album";
import Songs from "./components/Songs";
import Likes from "./components/Likes";
import SongDetails from "./components/SongDetails";
import Import from "./components/Import";
import Login from "./components/Login";
import Register from "./components/Register";
import SharedPlaylist from "./components/SharedPlaylist";
import AdminDashboard from "./components/AdminDashboard";
import MyPlaylists from "./components/MyPlaylists";
import MyPlaylistDetails from "./components/MyPlaylistDetails";

const App = () => {
  return (
    <PlayerProvider>
      <LikedSongsProvider>
      <PlaylistProvider>
        <div className="w-full h-screen">
          <Toaster position="top-center" reverseOrder={false} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/songs" element={<Songs />} />
            <Route path="/songs/details/:id" element={<SongDetails />} />
            <Route path="/album" element={<Album />} />
            <Route path="/albums/details/:id" element={<AlbumDetails />} />
            <Route path="/download" element={<Download />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/playlist/details/:id" element={<PlaylistDetails />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/artists/details/:id" element={<ArtistsDetails />} />
            <Route path="/likes" element={<Likes />} />
            <Route path="/import" element={<Import />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/shared/:id" element={<SharedPlaylist />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/my-playlists" element={<MyPlaylists />} />
            <Route path="/:username/:id" element={<MyPlaylistDetails />} />
          </Routes>
          <PlayerBar />
        </div>
      </PlaylistProvider>
      </LikedSongsProvider>
    </PlayerProvider>
  );
};

export default App;

