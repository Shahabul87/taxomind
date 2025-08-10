import { logger } from '@/lib/logger';

// Form component continued

export const SubscriptionLinkForm = ({
  userId,
  subscriptions = [],
}: SubscriptionLinkFormProps) => {
  // State management
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "amount">("date");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);

  // UI Elements
  const toggleCreating = () => {
    setIsCreating((current) => !current);
    setEditMode(false);
    form.reset({
      name: "",
      platform: "",
      url: "",
      category: "",
      dateOfSubscription: format(new Date(), "yyyy-MM-dd"),
      endOfSubscription: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      cardUsed: "",
      amount: 0,
      billingCycle: "monthly",
      isRenewing: true,
      notes: "",
      notificationEnabled: true,
      notificationDays: [1, 3, 7],
      notificationEmail: true,
      notificationPush: true,
    });
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setEditingSubscriptionId(null);
    form.reset();
  };

  const router = useRouter();

  // Form setup with extended schema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      platform: "",
      url: "",
      category: "",
      dateOfSubscription: format(new Date(), "yyyy-MM-dd"),
      endOfSubscription: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      cardUsed: "",
      amount: 0,
      billingCycle: "monthly",
      isRenewing: true,
      notes: "",
      notificationEnabled: true,
      notificationDays: [1, 3, 7],
      notificationEmail: true,
      notificationPush: true,
    },
    mode: "onChange",
  });

  const { isSubmitting, isValid } = form.formState;
  const watchedValues = form.watch();

  // Determine if form has essential fields filled
  const isFormComplete = watchedValues.name && 
    watchedValues.platform && 
    watchedValues.url && 
    watchedValues.cardUsed && 
    watchedValues.amount > 0;

  // Filter and sort subscriptions based on active tab and search query
  const filteredSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];
    
    // Apply tab filter
    if (activeTab !== "all") {
      if (activeTab === "active") {
        filtered = filtered.filter(sub => 
          isAfter(new Date(sub.endOfSubscription), new Date())
        );
      } else if (activeTab === "expiring") {
        const thirtyDaysFromNow = addDays(new Date(), 30);
        filtered = filtered.filter(sub => 
          isAfter(new Date(sub.endOfSubscription), new Date()) && 
          isBefore(new Date(sub.endOfSubscription), thirtyDaysFromNow)
        );
      } else if (activeTab === "expired") {
        filtered = filtered.filter(sub => 
          isBefore(new Date(sub.endOfSubscription), new Date())
        );
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.name.toLowerCase().includes(query) || 
        sub.platform.toLowerCase().includes(query) ||
        (sub.category && sub.category.toLowerCase().includes(query))
      );
    }
    
    // Apply sort
    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "amount") {
        return b.amount - a.amount;
      } else {
        // Default sort by date (newest renewal first)
        return new Date(b.endOfSubscription).getTime() - new Date(a.endOfSubscription).getTime();
      }
    });
  }, [subscriptions, activeTab, searchQuery, sortBy]);

  // Submission handlers
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsUpdating(true);
      // Transform dates to ISO format for API
      const transformedValues = {
        ...values,
        dateOfSubscription: new Date(values.dateOfSubscription).toISOString(),
        endOfSubscription: new Date(values.endOfSubscription).toISOString(),
      };
      
      await axios.post(`/api/users/${userId}/subscriptions`, transformedValues);
      toast.success("Subscription added");
      toggleCreating();
      router.refresh();
    } catch (error) {
      logger.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onSave = async (values: z.infer<typeof formSchema>) => {
    if (!editingSubscriptionId) return;

    try {
      setIsUpdating(true);
      // Transform dates to ISO format for API
      const transformedValues = {
        ...values,
        dateOfSubscription: new Date(values.dateOfSubscription).toISOString(),
        endOfSubscription: new Date(values.endOfSubscription).toISOString(),
      };
      
      await axios.patch(`/api/users/${userId}/subscriptions/${editingSubscriptionId}`, transformedValues);
      toast.success("Subscription updated");
      setEditMode(false);
      setEditingSubscriptionId(null);
      form.reset();
      router.refresh();
    } catch (error) {
      logger.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/users/${userId}/subscriptions/reorder`, { list: updateData });
      toast.success("Subscriptions reordered");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    const subscriptionToEdit = subscriptions.find((sub) => sub.id === id);
    if (subscriptionToEdit) {
      setEditMode(true);
      setEditingSubscriptionId(id);
      
      // Set form values from the subscription
      form.reset({
        name: subscriptionToEdit.name,
        platform: subscriptionToEdit.platform,
        url: subscriptionToEdit.url,
        category: subscriptionToEdit.category || "",
        dateOfSubscription: format(new Date(subscriptionToEdit.dateOfSubscription), "yyyy-MM-dd"),
        endOfSubscription: format(new Date(subscriptionToEdit.endOfSubscription), "yyyy-MM-dd"),
        cardUsed: subscriptionToEdit.cardUsed,
        amount: subscriptionToEdit.amount,
        billingCycle: "monthly", // Default as it's not in original data
        isRenewing: true, // Default as it's not in original data
        notes: "",
        notificationEnabled: true,
        notificationDays: [1, 3, 7],
        notificationEmail: true,
        notificationPush: true,
      });
    }
  };

  const confirmDelete = (id: string) => {
    setSubscriptionToDelete(id);
    setShowDeleteDialog(true);
  };

  const onDelete = async () => {
    if (!subscriptionToDelete) return;
    
    try {
      setIsLoading(true);
      await axios.delete(`/api/users/${userId}/subscriptions/${subscriptionToDelete}`);
      toast.success("Subscription deleted");
      setShowDeleteDialog(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
      setSubscriptionToDelete(null);
    }
  };

  const onToggleNotification = async (id: string, enabled: boolean) => {
    try {
      setIsLoading(true);
      await toggleNotification(id, enabled);
      toast.success(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error("Couldn't update notification settings");
    } finally {
      setIsLoading(false);
    }
  };
} 