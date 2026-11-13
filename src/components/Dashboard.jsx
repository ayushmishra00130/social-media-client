import React, { useState, useEffect } from 'react';
import API from '../api';
import { socket } from '../socket';

export default function Dashboard({ user, onLogout, onUpdateUser }) {
    const [posts, setPosts] = useState([]);
    const [text, setText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [activeTab, setActiveTab] = useState('feed');
    const [allUsers, setAllUsers] = useState([]);

    const [profileData, setProfileData] = useState({
        name: user.name || '',
        bio: user.bio || '',
        profilePicUrl: user.profilePicUrl || ''
    });

    const fetchUsers = async () => {
        try {
            const { data } = await API.get('/auth/all');
            setAllUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            const { data } = await API.get('/posts');
            setPosts(data);
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchUsers();

        socket.on('post_liked', (updatedPost) => {
            setPosts((prevPosts) =>
                prevPosts.map((p) => (p._id === updatedPost._id ? updatedPost : p))
            );
        });

        return () => {
            socket.off('post_liked');
        };
    }, []);

    const handleToggleFollow = async (targetId) => {
        try {
            const { data } = await API.put(`/auth/follow/${targetId}`);
            const updatedUser = { ...user, following: data.following };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            onUpdateUser(updatedUser);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update follow state');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            const { data } = await API.post('/posts', { text, imageUrl });
            setPosts([data, ...posts]);
            setText('');
            setImageUrl('');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create post');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await API.delete(`/posts/${postId}`);
            setPosts(posts.filter((p) => p._id !== postId));
        } catch (err) {
            alert(err.response?.data?.message || 'Unauthorized or failed to delete');
        }
    };

    const handleLike = (postId) => {
        socket.emit('like_post', { postId, userId: user.id });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.put('/auth/profile', profileData);
            localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
            onUpdateUser({ ...user, ...data });
            alert('Profile updated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update profile');
        }
    };

    const displayedPosts = activeTab === 'myPosts'
        ? posts.filter((p) => (p.author?._id || p.author) === user.id)
        : posts;

    const navTabs = [
        { id: 'feed', label: 'Feed' },
        { id: 'explore', label: 'Explore' },
        { id: 'myPosts', label: 'My Posts' },
        { id: 'profile', label: 'Profile' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Top Navigation */}
            <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
                    {/* Brand */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('feed')}>
                        <span className="font-bold text-slate-900 tracking-tight text-sm hidden sm:inline">Mini Social Media</span>
                    </div>

                    {/* Navigation segmented control */}
                    <nav className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                        {navTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeTab === tab.id
                                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* User info & Logout */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600 hidden md:inline">{user.name}</span>
                        <button
                            onClick={onLogout}
                            className="text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-xl mx-auto py-6 px-4">
                {activeTab === 'profile' ? (
                    /* Profile View */
                    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
                        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-5">
                            {profileData.profilePicUrl ? (
                                <img src={profileData.profilePicUrl} alt={profileData.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base border border-slate-200">
                                    {profileData.name ? profileData.name[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">{profileData.name || 'Your Profile'}</h2>
                                <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Email address</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Bio</label>
                                <textarea
                                    rows="3"
                                    placeholder="Write a brief bio..."
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Profile Picture URL</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/avatar.jpg"
                                    value={profileData.profilePicUrl}
                                    onChange={(e) => setProfileData({ ...profileData, profilePicUrl: e.target.value })}
                                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                ) : activeTab === 'explore' ? (
                    /* Explore View */
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-slate-900">Discover Users</h2>
                            <p className="text-xs text-slate-500">Connect with other people on MiniSocial</p>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {allUsers.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-6">No users found</p>
                            ) : (
                                allUsers.map((u) => {
                                    const isFollowing = user.following?.includes(u._id);
                                    return (
                                        <div key={u._id} className="py-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {u.profilePicUrl ? (
                                                    <img src={u.profilePicUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200 flex-shrink-0">
                                                        {u.name ? u.name[0].toUpperCase() : 'U'}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-900 truncate">{u.name}</p>
                                                    <p className="text-xs text-slate-400 truncate">{u.bio || 'No bio yet'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleToggleFollow(u._id)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0 ${isFollowing
                                                    ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                                    }`}
                                            >
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    /* Feed & My Posts */
                    <>
                        {/* Create Post Form (Only on Feed tab) */}
                        {activeTab === 'feed' && (
                            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs mb-4">
                                <form onSubmit={handleCreatePost} className="space-y-3">
                                    <textarea
                                        placeholder="What's happening?"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        className="w-full p-3 text-sm bg-slate-50/50 border border-slate-200 rounded-lg resize-none text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                        rows="3"
                                    />
                                    <div className="flex items-center justify-between gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add image URL (optional)"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            className="flex-1 px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                                        />
                                        <button
                                            type="submit"
                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'myPosts' && (
                            <div className="mb-3 px-1 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-900">Your Posts</h2>
                                <span className="text-xs text-slate-400">{displayedPosts.length} posts</span>
                            </div>
                        )}

                        {/* Posts List */}
                        <div className="space-y-3">
                            {displayedPosts.length === 0 ? (
                                <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-xs text-slate-400">
                                    {activeTab === 'myPosts' ? "You haven't posted anything yet." : 'No posts in feed yet.'}
                                </div>
                            ) : (
                                displayedPosts.map((post) => {
                                    const isLikedByMe = post.likes?.includes(user.id);
                                    const isOwner = (post.author?._id || post.author) === user.id;

                                    return (
                                        <article key={post._id} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
                                            {/* Post Author Row */}
                                            <div className="flex justify-between items-center mb-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    {post.author?.profilePicUrl ? (
                                                        <img src={post.author.profilePicUrl} alt={post.author?.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                                                            {post.author?.name ? post.author.name[0].toUpperCase() : 'U'}
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-semibold text-slate-900">{post.author?.name || 'User'}</span>
                                                </div>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => handleDeletePost(post._id)}
                                                        className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>

                                            {/* Post Body */}
                                            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{post.text}</p>

                                            {/* Post Image */}
                                            {post.imageUrl && (
                                                <img
                                                    src={post.imageUrl}
                                                    alt="Post media"
                                                    className="mt-3 w-full max-h-80 object-cover rounded-lg border border-slate-100"
                                                />
                                            )}

                                            {/* Post Actions */}
                                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-3">
                                                <button
                                                    onClick={() => handleLike(post._id)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${isLikedByMe
                                                        ? 'text-rose-600 bg-rose-50'
                                                        : 'text-slate-500 hover:text-rose-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <span>{isLikedByMe ? '❤️' : '🤍'}</span>
                                                    <span>{post.likes?.length || 0}</span>
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}