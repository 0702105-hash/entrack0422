<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Display the login view.
     */
    public function create()
    {
        return Inertia::render('Auth/Login'); // Adjust this to match your React login component path
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request)
    {
        // 1. Validate the incoming data
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // 2. Attempt to authenticate the user
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            // 3. Prevent session fixation attacks
            $request->session()->regenerate();

            // 4. Redirect to intended page (or dashboard by default)
            return redirect()->intended('/dashboard');
        }

        // 5. If authentication fails, throw a validation error back to React
        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Destroy an authenticated session (Logout).
     */
    public function destroy(Request $request)
    {
        // 1. Log the user out
        Auth::logout();

        // 2. Invalidate the user's session
        $request->session()->invalidate();

        // 3. Regenerate the CSRF token for security
        $request->session()->regenerateToken();

        // 4. Redirect to the login page
        return redirect('/');
    }
}