        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, deleteUser, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
        import { getFirestore, doc, getDoc, deleteDoc, collection, getDocs, writeBatch } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
        import { getStorage, ref as storageRef, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
        import { collectionGroup, query, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
        import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js';

        // ⚠️ IMPORTANT: Replace with your actual Firebase config
        const firebaseConfig = {
            apiKey: 'AIzaSyBFHe6lPV3cZBcG9gm1zT2EwHNRmOLpP8I',
            appId: '1:913522987647:web:77ec67ff2a1e736999a54a',
            messagingSenderId: '913522987647',
            projectId: 'cm-app-90d65',
            authDomain: 'cm-app-90d65.firebaseapp.com',
            storageBucket: 'cm-app-90d65.appspot.com',
            measurementId: 'G-NNYFG8919W',
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);

        try {
            const appCheck = initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider('6LfPImYsAAAAAN_e268QSEZ08LjyJ8z6PTZSNC5p'),
                isTokenAutoRefreshEnabled: true
            });
            console.log('App Check initialized successfully');
        } catch (error) {
            console.error('App Check initialization failed:', error);
            document.body.innerHTML = `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        background: #154734;
                        color: #F5E6D3;
                        font-family: 'Source Serif 4', serif;
                        text-align: center;
                        padding: 2rem;
                    ">
                        <div>
                            <h1 style="font-size: 2rem; margin-bottom: 1rem;">Security Verification Failed</h1>
                            <p style="margin-bottom: 1rem;">We couldn't verify your browser's security settings.</p>
                            <p style="font-size: 0.9rem; opacity: 0.8;">Please ensure cookies are enabled and try refreshing the page.</p>
                            <button onclick="location.reload()" style="
                                margin-top: 2rem;
                                padding: 1rem 2rem;
                                background: #D4AF37;
                                border: none;
                                cursor: pointer;
                                font-size: 1rem;
                                font-weight: bold;
                            ">Retry</button>
                        </div>
                    </div>
                `;
                throw new Error('App Check required for production');
        }

        // DOM Elements
        const signInCard = document.getElementById('signInCard');
        const accountCard = document.getElementById('accountCard');
        const deleteCard = document.getElementById('deleteCard');
        const forgotPasswordCard = document.getElementById('forgotPasswordCard');

        const signInForm = document.getElementById('signInForm');
        const signInButton = document.getElementById('signInButton');
        const googleSignInButton = document.getElementById('googleSignInButton');
        const signInError = document.getElementById('signInError');

        const showDeleteButton = document.getElementById('showDeleteButton');
        const signOutButton = document.getElementById('signOutButton');
        const userEmail = document.getElementById('userEmail');
        const accountSuccess = document.getElementById('accountSuccess');
        const accountError = document.getElementById('accountError');

        const deleteForm = document.getElementById('deleteForm');
        const deleteButton = document.getElementById('deleteButton');
        const cancelDeleteButton = document.getElementById('cancelDeleteButton');
        const deleteError = document.getElementById('deleteError');

        const forgotPasswordButton = document.getElementById('forgotPasswordButton');
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        const backToSignInButton = document.getElementById('backToSignInButton');
        const forgotError = document.getElementById('forgotError');
        const forgotSuccess = document.getElementById('forgotSuccess');
        const sendResetButton = document.getElementById('sendResetButton');

        // Utility Functions
        function showCard(card) {
            [signInCard, accountCard, deleteCard, forgotPasswordCard].forEach(c => c.classList.add('hidden'));
            card.classList.remove('hidden');
        }

        function showError(element, message) {
            element.textContent = message;
            element.classList.add('show');
        }

        function hideError(element) {
            element.classList.remove('show');
            setTimeout(() => element.textContent = '', 300);
        }

        function showSuccess(element, message) {
            element.textContent = message;
            element.classList.add('show');
        }

        function hideSuccess(element) {
            element.classList.remove('show');
            setTimeout(() => element.textContent = '', 300);
        }
        

        function setButtonLoading(button, loading) {
            if (loading) {
                button.disabled = true;
                const span = button.querySelector('span');
                span.innerHTML = '<span class="loading"></span> Loading...';
            } else {
                button.disabled = false;
                // Reset button text to original
                const span = button.querySelector('span');
                if (button === signInButton) span.textContent = 'Sign In';
                else if (button === deleteButton) span.textContent = 'Delete Account Permanently';
                else if (button === sendResetButton) span.textContent = 'Send Reset Link';
                else if (button === googleSignInButton) span.textContent = 'Sign in with Google';
            }
        }

        // Auth State Observer
        auth.onAuthStateChanged((user) => {
            if (user) {
                userEmail.textContent = user.email;
                showCard(accountCard);
            } else {
                showCard(signInCard);
            }
        });

        // Sign In with Email/Password
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError(signInError);

            const email = document.getElementById('signInEmail').value.trim();
            const password = document.getElementById('signInPassword').value.trim();

            if (!email || !password) {
                showError(signInError, 'Email and password cannot be blank.');
                return;
            }

            setButtonLoading(signInButton, true);

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                
                if (!userCredential.user.emailVerified) {
                    showError(signInError, 'Please verify your email before signing in.');
                    await signOut(auth);
                    setButtonLoading(signInButton, false);
                    return;
                }

                // Success - will be handled by auth state observer
            } catch (error) {
                let message = 'An unexpected error occurred.';
                
                if (error.code === 'appCheck/recaptcha-error') {
                console.error('ReCAPTCHA Error Details:');
                console.error('- Possible causes:');
                console.error('  1. Wrong site key for this domain');
                console.error('  2. Domain not registered in reCAPTCHA admin');
                console.error('  3. Ad blocker or privacy extension blocking reCAPTCHA');
                console.error('  4. CSP headers blocking reCAPTCHA scripts');
                console.error('  5. reCAPTCHA servers unreachable');
                console.error('');
                console.error('Current domain:', window.location.hostname);
                console.error('Site key:', RECAPTCHA_SITE_KEY);
            } else if (error.code === 'appCheck/storage-open') {
                console.error('Storage Error: Browser storage (IndexedDB) not available');
                console.error('- Try: Use a regular browser window (not incognito)');
                console.error('- Try: Enable cookies in browser settings');
            }
                
                showError(signInError, message);
                setButtonLoading(signInButton, false);
            }
        });

        // Sign In with Google
        googleSignInButton.addEventListener('click', async () => {
            hideError(signInError);
            setButtonLoading(googleSignInButton, true);

            try {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
                // Success - handled by auth state observer
            } catch (error) {
                let message = 'Failed to sign in with Google.';
                
                if (error.code === 'auth/popup-closed-by-user') {
                    message = 'Sign-in cancelled.';
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    message = 'An account already exists with this email.';
                }
                
                showError(signInError, message);
                setButtonLoading(googleSignInButton, false);
            }
        });

        // Forgot Password
        forgotPasswordButton.addEventListener('click', () => {
            showCard(forgotPasswordCard);
            hideError(signInError);
        });

        backToSignInButton.addEventListener('click', () => {
            showCard(signInCard);
            hideError(forgotError);
            hideSuccess(forgotSuccess);
        });

        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError(forgotError);
            hideSuccess(forgotSuccess);

            const email = document.getElementById('resetEmail').value.trim();

            if (!email) {
                showError(forgotError, 'Please enter your email address.');
                return;
            }

            setButtonLoading(sendResetButton, true);

            try {
                await sendPasswordResetEmail(auth, email);
                showSuccess(forgotSuccess, `Password reset email sent to ${email}. Check your spam folder if you don't see it.`);
                document.getElementById('resetEmail').value = '';
            } catch (error) {
                let message = 'Failed to send reset email.';
                
                if (error.code === 'auth/user-not-found') {
                    message = 'No account found with this email.';
                } else if (error.code === 'auth/invalid-email') {
                    message = 'Invalid email address.';
                } else if (error.code === 'auth/too-many-requests') {
                    message = 'Too many attempts. Try again later.';
                }
                
                showError(forgotError, message);
            } finally {
                setButtonLoading(sendResetButton, false);
            }
        });

        // Show Delete Account Card
        showDeleteButton.addEventListener('click', () => {
            showCard(deleteCard);
            hideError(accountError);
            hideSuccess(accountSuccess);
        });

        // Cancel Delete
        cancelDeleteButton.addEventListener('click', () => {
            showCard(accountCard);
            hideError(deleteError);
            document.getElementById('deletePassword').value = '';
        });

        // Delete Account
        deleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError(deleteError);

            const password = document.getElementById('deletePassword').value.trim();

            if (!password) {
                showError(deleteError, 'Password is required.');
                return;
            }

            setButtonLoading(deleteButton, true);

            // Begin deleting all related user data
            try {
                const user = auth.currentUser;

                if (!user || !user.email) {
                    throw new Error('No authenticated user');
                }

                // Re-authenticate user
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);

                // Delete user data from Firestore
                const uid = user.uid;  
  

                // Delete Firebase Auth account
                // firbase cloud OnDelete trigger will handle all Firestore and Storage cleanup, so we only need to delete the user here
                await deleteUser(user);
                

                console.log(`Successfully cleaned up all data for user`);

                // Show success and redirect to sign in
                showCard(signInCard);
                showSuccess(signInError, 'Account deleted successfully.');
                setTimeout(() => hideSuccess(signInError), 5000);

            } catch (error) {
                let message = 'Failed to delete account.';
                
                if (error.code === 'auth/wrong-password') {
                    message = 'Password is incorrect.';
                } else if (error.code === 'auth/requires-recent-login') {
                    message = 'Please sign out and sign in again before deleting your account.';
                } else if (error.code === 'auth/invalid-credential') {
                    message = 'Invalid password.';
                }
                
                showError(deleteError, message);
                setButtonLoading(deleteButton, false);
            }
        });

        // Sign Out
        signOutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                showCard(signInCard);
            } catch (error) {
                showError(accountError, 'Failed to sign out.');
            }
        });
