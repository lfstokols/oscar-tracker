export type OscarAppContextValue= Readonly<{
		selectedTab: AppTabType,
		setSelectedTab: AppTabType => void,
		activeUsername: string,
		setActiveUsername: string => void,
	}>;
	
	const DEFAULT_CONTEXT_VALUE = {
		selectedTab: 'home',
		setSelectedTab: tab => {},
		activeUsername: null,
		setActiveUsername: username => {}
	};
	
	export const OscarAppContext = React.createContext(DEFAULT_CONTEXT_VALUEd) as React.Context<OscarAppContextValue>;
	 
	type Props =  {
		children: React.ChildrenArray<React.ReactElement>,
	};
	
	export default function OscarAppContextProvider(
		props: Props
	): React.ReactElement {
		const [selectedTab, setSelectedTab] = useState<AppTabType>('overview');
		const [activeUsername, setActiveUsername] = useState<string | null>(null);
	
		const contextValue = useMemo(() => {
			return {
					selectedTab,
					setSelectedTab,
					activeUsername,
					setActiveUsername,
				},
			};
		}, [
			selectedTab,
			setSelectedTab,
			activeUsername,
			setActiveUsername,
		]);
	
		return (
			<OscarAppContext.Provider value={contextValue}>
				{props.children}
			</OscarAppContext.Provider>
		);
	}
	
	//sample usage
	const contextValue = useContext(OscarAppContext); //puts current context value into variable contextValue
	// contextValue has type OscarAppContextValue
	const activeUsername = contextValue.activeUsername
	// activeUsername has type string
	
	// second example
	const {activeUsername} = useContext(OscarAppContext); //faster way to just get activeUsername