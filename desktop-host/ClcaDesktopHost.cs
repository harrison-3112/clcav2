// CloudMetrics – Desktop Host (WinForms + WebView2)
// Native GDI+ loading screen shown instantly; dismissed when JS sends 'clca-ui-ready'.
// Build: csc.exe /target:winexe /out:"CloudMetrics.exe" /win32icon:"ui\clca_icon_multi.ico"
//        /reference:Microsoft.Web.WebView2.Core.dll /reference:Microsoft.Web.WebView2.WinForms.dll
//        /reference:System.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll
//        /win32manifest:desktop-host\app.manifest
//        desktop-host\ClcaDesktopHost.cs

using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

// ── Assembly metadata (reduces AV false-positives) ─────────────────
[assembly: AssemblyTitle("CloudMetrics")]
[assembly: AssemblyDescription("CloudMetrics – Desktop Host")]
[assembly: AssemblyCompany("SLA NPI Team")]
[assembly: AssemblyProduct("CloudMetrics")]
[assembly: AssemblyCopyright("Copyright © 2025-2026 SLA NPI Team")]
[assembly: AssemblyVersion("1.5.0.0")]
[assembly: AssemblyFileVersion("1.5.0.0")]

// ── Helper: pass a window handle as IWin32Window ──────────────────
internal class HandleWindow : IWin32Window
{
    public HandleWindow(IntPtr h) { Handle = h; }
    public IntPtr Handle { get; private set; }
}

// ── COM-visible host object exposed to JS ──────────────────────────
[ClassInterface(ClassInterfaceType.AutoDual)]
[ComVisible(true)]
public class ClcaHostBridge
{
    private IntPtr _ownerHandle;

    /// <summary>Set the owner window handle so dialogs are parented correctly.</summary>
    internal void SetOwnerHandle(IntPtr handle) { _ownerHandle = handle; }

    /// <summary>
    /// Opens a native Save File dialog and returns the chosen path (or empty string if cancelled).
    /// Called from JS: window.chrome.webview.hostObjects.sync.clcaHost.BrowseSave(defaultName)
    /// </summary>
    public string BrowseSave(string defaultFileName)
    {
        string result = "";
        IntPtr hOwner = _ownerHandle;
        // SaveFileDialog must run on an STA thread
        var t = new Thread(() =>
        {
            using (var dlg = new SaveFileDialog())
            {
                dlg.Title = "Save Report As...";
                dlg.DefaultExt = "xlsx";
                dlg.Filter = "Excel Workbook (*.xlsx)|*.xlsx|All Files (*.*)|*.*";
                dlg.AddExtension = true;
                dlg.OverwritePrompt = true;
                dlg.RestoreDirectory = true;
                dlg.FileName = string.IsNullOrWhiteSpace(defaultFileName) ? "CLCA_Report.xlsx" : defaultFileName;
                IWin32Window owner = hOwner != IntPtr.Zero ? (IWin32Window)new HandleWindow(hOwner) : null;
                if (dlg.ShowDialog(owner) == DialogResult.OK)
                    result = dlg.FileName;
            }
        });
        t.SetApartmentState(ApartmentState.STA);
        t.Start();
        t.Join();
        return result;
    }
}

// ── Main Form ──────────────────────────────────────────────────────
public class MainForm : Form
{
    private WebView2 webView;
    private Process nodeProcess;
    private string appRoot;
    private string logPath;
    private bool isClosing;
    private const int PORT = 5000;

    // ── Native loading overlay ────────────────────────────────────
    private SplashOverlay splash;

    public MainForm()
    {
        appRoot = AppDomain.CurrentDomain.BaseDirectory;
        logPath = Path.Combine(appRoot, "desktop-host", "host.log");

        // Form setup
        Text = "CloudMetrics";
        AutoScaleMode = AutoScaleMode.Dpi;
        Width = 1458;
        Height = 972;
        MinimumSize = new Size(1161, 756);
        StartPosition = FormStartPosition.CenterScreen;

        // Try to set icon
        try
        {
            string icoPath = Path.Combine(appRoot, "ui", "clca_icon_multi.ico");
            if (!File.Exists(icoPath))
                icoPath = Path.Combine(appRoot, "ui", "app icon.ico");
            if (File.Exists(icoPath))
                Icon = new Icon(icoPath);
        }
        catch { }

        // WebView2 control fills the form
        webView = new WebView2();
        webView.Dock = DockStyle.Fill;
        // Set default BG to match the loader gradient (avoids white flash before page loads)
        webView.DefaultBackgroundColor = Color.FromArgb(0xE8, 0xEC, 0xF8);
        Controls.Add(webView);

        // ── Create native splash (shows instantly) ──
        string logoPath = Path.Combine(appRoot, "ui", "icon.png");
        splash = new SplashOverlay(logoPath);
        splash.Dock = DockStyle.Fill;
        Controls.Add(splash);
        splash.BringToFront();

        FormClosing += OnFormClosing;
    }

    protected override async void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        Log("Desktop host startup begin");
        Log("appRoot=" + appRoot);

        try
        {
            // 1. Start Node.js backend
            StartBackend();

            // 2. Initialize WebView2
            await InitWebView();

            Log("OnLoad completed successfully.");
        }
        catch (Exception ex)
        {
            Log("CRITICAL OnLoad error: " + ex.ToString());
        }
    }

    // ── Logging ───────────────────────────────────────────────────
    private void Log(string msg)
    {
        try
        {
            string dir = Path.GetDirectoryName(logPath);
            if (!Directory.Exists(dir))
                Directory.CreateDirectory(dir);
            string line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") + " " + msg + "\r\n";
            File.AppendAllText(logPath, line);
        }
        catch { }
    }

    // ── Node.js Backend ───────────────────────────────────────────
    private void StartBackend()
    {
        try
        {
            string nodeExe = Path.Combine(appRoot, "runtime", "node", "node.exe");
            if (!File.Exists(nodeExe))
            {
                // Fallback to system node
                nodeExe = "node";
            }
            string serverJs = Path.Combine(appRoot, "server.js");

            var psi = new ProcessStartInfo
            {
                FileName = nodeExe,
                Arguments = "\"" + serverJs + "\"",
                WorkingDirectory = appRoot,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };
            psi.EnvironmentVariables["NO_BROWSER"] = "1";

            nodeProcess = new Process { StartInfo = psi, EnableRaisingEvents = true };

            nodeProcess.OutputDataReceived += (s, ev) =>
            {
                if (ev.Data != null) Log("[node:out] " + ev.Data);
            };
            nodeProcess.ErrorDataReceived += (s, ev) =>
            {
                if (ev.Data != null) Log("[node:err] " + ev.Data);
            };
            nodeProcess.Exited += (s, ev) =>
            {
                if (!isClosing)
                    Log("Node process exited unexpectedly.");
            };

            nodeProcess.Start();
            nodeProcess.BeginOutputReadLine();
            nodeProcess.BeginErrorReadLine();
        }
        catch (Exception ex)
        {
            Log("Failed to start backend: " + ex.Message);
        }
    }

    private bool WaitForBackend()
    {
        string url = "http://127.0.0.1:" + PORT + "/api/health";
        for (int i = 0; i < 60; i++)
        {
            try
            {
                var req = WebRequest.CreateHttp(url);
                req.Timeout = 800;
                using (var resp = req.GetResponse())
                {
                    Log("Backend is reachable at http://127.0.0.1:" + PORT);
                    return true;
                }
            }
            catch
            {
                Thread.Sleep(250);
            }
        }
        Log("Backend did not become reachable within timeout.");
        return false;
    }

    // ── WebView2 Init ─────────────────────────────────────────────
    private async Task InitWebView()
    {
        try
        {
            string userDataFolder = Path.Combine(appRoot, "desktop-host", "wv2-user-data");
            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await webView.EnsureCoreWebView2Async(env);

            // Settings
            var settings = webView.CoreWebView2.Settings;
            settings.IsStatusBarEnabled = false;
            settings.AreDefaultContextMenusEnabled = false;
            settings.IsZoomControlEnabled = false;
            settings.AreDevToolsEnabled = false;

            // Expose host bridge object to JS (with owner handle for dialog parenting)
            var bridge = new ClcaHostBridge();
            bridge.SetOwnerHandle(this.Handle);
            webView.CoreWebView2.AddHostObjectToScript("clcaHost", bridge);

            // Listen for the ready signal from the frontend
            webView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;

            // Navigation events (for logging)
            webView.CoreWebView2.NavigationStarting += (s, ev) =>
            {
                string uri = ev.Uri ?? "";
                if (uri.StartsWith("file://", StringComparison.OrdinalIgnoreCase))
                    Log("WebView2 navigation started (local UI)");
                else
                    Log("WebView2 navigation started");
            };

            webView.CoreWebView2.NavigationCompleted += (s, ev) =>
            {
                Log("WebView2 navigation completed.");
            };

            // Show form immediately and navigate only once (directly to backend URL)
            Show();
            Activate();

            bool ready = await Task.Run(() => WaitForBackend());
            if (!ready)
            {
                MessageBox.Show(
                    "Backend server failed to start in time.\n\nPlease restart CloudMetrics.",
                    "CloudMetrics", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Application.Exit();
                return;
            }

            string appUrl = "http://127.0.0.1:" + PORT + "/";
            webView.CoreWebView2.Navigate(appUrl);

            // Safety timeout: dismiss splash after 30s even if clca-ui-ready is never sent
            var safetyTimer = new System.Windows.Forms.Timer();
            safetyTimer.Interval = 30000;
            safetyTimer.Tick += (s, ev) =>
            {
                safetyTimer.Stop();
                safetyTimer.Dispose();
                if (splash != null)
                {
                    Log("Safety timeout: dismissing splash after 30s.");
                    DismissSplash();
                }
            };
            safetyTimer.Start();
        }
        catch (Exception ex)
        {
            Log("WebView2 init failed: " + ex.Message);
            MessageBox.Show(
                "WebView2 initialization failed.\n\n" + ex.Message +
                "\n\nPlease install the WebView2 Runtime from:\nhttps://go.microsoft.com/fwlink/p/?LinkId=2124703",
                "CloudMetrics", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Application.Exit();
        }
    }

    // ── WebView2 Message Handling ─────────────────────────────────
    private void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            string msg = e.TryGetWebMessageAsString();
            if (msg == "clca-ui-ready")
            {
                Log("Frontend ready signal received – dismissing native splash.");
                webView.CoreWebView2.WebMessageReceived -= OnWebMessageReceived;
                DismissSplash();
            }
        }
        catch { }
    }

    private void DismissSplash()
    {
        if (splash == null) return;
        splash.FadeOut(() =>
        {
            if (InvokeRequired)
                BeginInvoke((Action)RemoveSplash);
            else
                RemoveSplash();
        });
    }

    private void RemoveSplash()
    {
        if (splash != null)
        {
            Controls.Remove(splash);
            splash.Dispose();
            splash = null;
            Log("Native splash removed.");
        }
    }

    // ── Cleanup ───────────────────────────────────────────────────
    private void OnFormClosing(object sender, FormClosingEventArgs e)
    {
        Log("Form closing. Reason=" + e.CloseReason.ToString());
        isClosing = true;
        StopBackend();
    }

    private void StopBackend()
    {
        try
        {
            if (nodeProcess != null && !nodeProcess.HasExited)
            {
                Log("Stopping backend process " + nodeProcess.Id);
                nodeProcess.Kill();
                nodeProcess.WaitForExit(3000);
            }
        }
        catch (Exception ex)
        {
            Log("Error stopping backend: " + ex.Message);
        }
    }
}

// ── Native Loading Overlay ─────────────────────────────────────────
// Pre-rendered frames + System.Threading.Timer for buttery smooth animation.
// All spinner frames are baked into bitmaps at startup → OnPaint just blits.
public class SplashOverlay : Panel
{
    // ── Pre-rendered caches ──
    private Bitmap bgCache;                // gradient + logo (static, rebuilt on resize)
    private Bitmap[] spinFrames;           // pre-rendered spinner rotations
    private const int SPIN_FRAME_COUNT = 90; // 90 frames = 4° per frame, very smooth
    private const int SPIN_TILE = 72;      // spinner tile size (60 + padding)

    // ── Animation state ──
    private int currentSpinFrame;
    private Stopwatch sw;
    private long lastTickMs;
    private float spinAccum;               // accumulated time for spinner (seconds)
    private float fadeAlpha = 1f;
    private bool fading;
    private Action onFadeComplete;
    private bool disposed;

    // ── Threading ──
    private System.Threading.Timer renderTimer;

    // ── Layout cache ──
    private int cachedW, cachedH;
    private Rectangle spinDestRect;        // where to blit spinner on screen
    private Image logo;

    // Gradient colors matching CSS
    private static readonly Color[] GradColors = {
        ColorTranslator.FromHtml("#e8d5f5"),
        ColorTranslator.FromHtml("#d4e4f7"),
        ColorTranslator.FromHtml("#e0f0ff"),
        ColorTranslator.FromHtml("#f0f4ff"),
        ColorTranslator.FromHtml("#e8ecf8"),
        ColorTranslator.FromHtml("#f0e0f0"),
        ColorTranslator.FromHtml("#edd5e8")
    };
    private static readonly float[] GradPositions = { 0f, 0.2f, 0.4f, 0.55f, 0.7f, 0.85f, 1f };

    public SplashOverlay(string logoPath)
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint |
                 ControlStyles.UserPaint |
                 ControlStyles.OptimizedDoubleBuffer, true);
        BackColor = Color.FromArgb(0xE8, 0xEC, 0xF8);

        try
        {
            if (File.Exists(logoPath))
                logo = Image.FromFile(logoPath);
        }
        catch { }

        // Pre-render spinner frames (tiny bitmaps, very fast)
        PreRenderSpinnerFrames();

        sw = Stopwatch.StartNew();
        lastTickMs = sw.ElapsedMilliseconds;

        // System.Threading.Timer runs on threadpool – immune to UI thread blocking
        renderTimer = new System.Threading.Timer(OnTimerTick, null, 0, 14);
    }

    /// <summary>Pre-render all spinner rotation frames into small bitmaps.</summary>
    private void PreRenderSpinnerFrames()
    {
        int sz = 60; // spinner diameter
        int tile = SPIN_TILE;
        int pad = (tile - sz) / 2;
        spinFrames = new Bitmap[SPIN_FRAME_COUNT];

        for (int i = 0; i < SPIN_FRAME_COUNT; i++)
        {
            var bmp = new Bitmap(tile, tile, PixelFormat.Format32bppPArgb);
            using (var g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                float angle = i * 360f / SPIN_FRAME_COUNT;

                g.TranslateTransform(tile / 2f, tile / 2f);
                g.RotateTransform(angle);
                g.TranslateTransform(-tile / 2f, -tile / 2f);

                using (var cyanPen = new Pen(Color.FromArgb(0x7A, 0xB8, 0xD9), 3.5f))
                using (var purplePen = new Pen(Color.FromArgb(0xB8, 0xA9, 0xD4), 3.5f))
                {
                    cyanPen.StartCap = LineCap.Round;
                    cyanPen.EndCap = LineCap.Round;
                    purplePen.StartCap = LineCap.Round;
                    purplePen.EndCap = LineCap.Round;
                    g.DrawArc(cyanPen, pad, pad, sz, sz, -90, 90);
                    g.DrawArc(purplePen, pad, pad, sz, sz, 0, 90);
                }
            }
            spinFrames[i] = bmp;
        }
    }

    /// <summary>Build the static background cache (gradient + logo). Called on resize.</summary>
    private void BuildBgCache(int w, int h)
    {
        if (w < 1 || h < 1) return;
        if (bgCache != null) bgCache.Dispose();
        bgCache = new Bitmap(w, h, PixelFormat.Format32bppPArgb);

        using (var g = Graphics.FromImage(bgCache))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            var rect = new Rectangle(0, 0, w, h);

            // Gradient background
            using (var brush = new LinearGradientBrush(rect, Color.White, Color.White, 135f))
            {
                var blend = new ColorBlend(GradColors.Length);
                blend.Colors = GradColors;
                blend.Positions = GradPositions;
                brush.InterpolationColors = blend;
                g.FillRectangle(brush, rect);
            }

            int cx = w / 2;
            int cy = h / 2;
            int boxSize = 120;
            int boxX = cx - boxSize / 2;
            int boxY = cy - boxSize / 2 - 30;
            int cr = 33;

            // Shadow
            using (var sp = RoundedRectPath(boxX, boxY + 4, boxSize, boxSize, cr))
            using (var sb = new SolidBrush(Color.FromArgb(26, 0, 131, 194)))
                g.FillPath(sb, sp);

            // White rounded rect
            using (var bp = RoundedRectPath(boxX, boxY, boxSize, boxSize, cr))
            using (var bb = new SolidBrush(Color.FromArgb(217, 255, 255, 255)))
                g.FillPath(bb, bp);

            // Logo image
            if (logo != null)
            {
                int imgSz = 84;
                int imgX = cx - imgSz / 2;
                int imgY = boxY + (boxSize - imgSz) / 2;
                g.DrawImage(logo, imgX, imgY, imgSz, imgSz);
            }
        }

        // Compute spinner destination rect
        int cx2 = w / 2;
        int cy2 = h / 2;
        int bY = cy2 - 60 - 30; // boxY
        int spnY = bY + 120 + 32;
        spinDestRect = new Rectangle(cx2 - SPIN_TILE / 2, spnY - (SPIN_TILE - 60) / 2, SPIN_TILE, SPIN_TILE);

        cachedW = w;
        cachedH = h;
    }

    public void FadeOut(Action onDone)
    {
        onFadeComplete = onDone;
        fading = true;
    }

    /// <summary>Timer callback on threadpool thread – compute frame index, then BeginInvoke to UI.</summary>
    private void OnTimerTick(object state)
    {
        if (disposed) return;

        long now = sw.ElapsedMilliseconds;
        float dt = (now - lastTickMs) / 1000f;
        lastTickMs = now;
        if (dt <= 0f) dt = 0.014f;
        if (dt > 0.1f) dt = 0.1f;

        // Advance spinner: 1.4s per full rotation
        spinAccum += dt;
        float phase = (spinAccum / 1.4f) % 1f;
        currentSpinFrame = (int)(phase * SPIN_FRAME_COUNT) % SPIN_FRAME_COUNT;

        if (fading)
        {
            fadeAlpha -= dt / 0.35f;
            if (fadeAlpha <= 0f)
            {
                fadeAlpha = 0f;
                if (renderTimer != null)
                {
                    renderTimer.Change(System.Threading.Timeout.Infinite, System.Threading.Timeout.Infinite);
                }
                try
                {
                    if (!disposed && IsHandleCreated)
                        BeginInvoke((Action)(() =>
                        {
                            if (onFadeComplete != null) onFadeComplete();
                        }));
                }
                catch { }
                return;
            }
        }

        // Request repaint on UI thread (non-blocking)
        try
        {
            if (!disposed && IsHandleCreated)
                BeginInvoke((Action)Invalidate);
        }
        catch { }
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        int w = ClientRectangle.Width;
        int h = ClientRectangle.Height;
        if (w < 1 || h < 1) return;

        // Rebuild caches if size changed
        if (w != cachedW || h != cachedH || bgCache == null)
            BuildBgCache(w, h);

        // ── Blit cached background (one fast DrawImage) ──
        if (bgCache != null)
        {
            if (fadeAlpha >= 1f)
            {
                g.DrawImageUnscaled(bgCache, 0, 0);
            }
            else
            {
                // During fade-out, draw with reduced alpha
                using (var ia = new ImageAttributes())
                {
                    float[][] mx = {
                        new float[] {1, 0, 0, 0, 0},
                        new float[] {0, 1, 0, 0, 0},
                        new float[] {0, 0, 1, 0, 0},
                        new float[] {0, 0, 0, fadeAlpha, 0},
                        new float[] {0, 0, 0, 0, 1}
                    };
                    ia.SetColorMatrix(new ColorMatrix(mx));
                    g.DrawImage(bgCache,
                        new Rectangle(0, 0, w, h),
                        0, 0, w, h, GraphicsUnit.Pixel, ia);
                }
            }
        }

        // ── Blit pre-rendered spinner frame (one fast DrawImage) ──
        if (spinFrames != null)
        {
            var frame = spinFrames[currentSpinFrame];
            if (fadeAlpha >= 1f)
            {
                g.DrawImageUnscaled(frame, spinDestRect.X, spinDestRect.Y);
            }
            else
            {
                using (var ia = new ImageAttributes())
                {
                    float[][] mx = {
                        new float[] {1, 0, 0, 0, 0},
                        new float[] {0, 1, 0, 0, 0},
                        new float[] {0, 0, 1, 0, 0},
                        new float[] {0, 0, 0, fadeAlpha, 0},
                        new float[] {0, 0, 0, 0, 1}
                    };
                    ia.SetColorMatrix(new ColorMatrix(mx));
                    g.DrawImage(frame,
                        spinDestRect,
                        0, 0, SPIN_TILE, SPIN_TILE, GraphicsUnit.Pixel, ia);
                }
            }
        }
    }

    private static GraphicsPath RoundedRectPath(int x, int y, int w, int h, int r)
    {
        var p = new GraphicsPath();
        int d = Math.Max(1, r * 2);
        p.AddArc(x, y, d, d, 180, 90);
        p.AddArc(x + w - d, y, d, d, 270, 90);
        p.AddArc(x + w - d, y + h - d, d, d, 0, 90);
        p.AddArc(x, y + h - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }

    protected override void Dispose(bool disposing)
    {
        disposed = true;
        if (disposing)
        {
            if (renderTimer != null) { renderTimer.Dispose(); renderTimer = null; }
            if (bgCache != null) { bgCache.Dispose(); bgCache = null; }
            if (spinFrames != null)
            {
                for (int i = 0; i < spinFrames.Length; i++)
                    if (spinFrames[i] != null) spinFrames[i].Dispose();
                spinFrames = null;
            }
            if (logo != null) { logo.Dispose(); logo = null; }
            sw = null;
        }
        base.Dispose(disposing);
    }
}

// ── Entry Point ────────────────────────────────────────────────────
static class Program
{
    [STAThread]
    static void Main()
    {
        // Prevent multiple instances using a named Mutex
        bool createdNew;
        using (var mutex = new Mutex(true, "Global\\CloudMetrics_SingleInstance_SLA_NPI", out createdNew))
        {
            if (!createdNew)
            {
                // Another instance is already running
                MessageBox.Show(
                    "CloudMetrics is already running.\n\nPlease check the taskbar for the existing window.",
                    "CloudMetrics", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            // DPI awareness is handled by app.manifest (dpiAware + dpiAwareness)
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
