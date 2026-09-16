// Force default admin state to FALSE
const [isAdmin, setIsAdmin] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Direct Database Check for is_admin flag
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, balance")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setIsAdmin(profile.is_admin === true); // STRICT CHECK
        setUserBalance(Number(profile.balance) || 0);
      } else {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  } catch (err) {
    setIsAdmin(false);
  } finally {
    setLoading(false);
  }
};
