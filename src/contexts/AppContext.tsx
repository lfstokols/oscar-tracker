import React, { useState, useMemo, useEffect, useContext } from "react";
import { AppTabType } from "../types/Enums"
import Cookies from 'js-cookie';

export type OscarAppContextValue= Readonly<{
	selectedTab: AppTabType,
	setSelectedTab: (tab:AppTabType) => void,
	activeUser: string|null,
	setActiveUser: (username:string|null) => void,
	preferences: Preferences,
	setPreferences: (pref:Preferences) => void,
	year: number,
	setYear: (year:number) => void,
}>;

const DEFAULT_CONTEXT_VALUE:OscarAppContextValue = {
	selectedTab: AppTabType.legacy,
	setSelectedTab: (tab) => {},
	activeUser: null,
	setActiveUser: (username) => {},
	preferences: {shortsAreSeparate: false},
	setPreferences: (pref) => {},
	year: 2023,
	setYear: (year) => {},
};

export const OscarAppContext:React.Context<OscarAppContextValue> = React.createContext(DEFAULT_CONTEXT_VALUE);
	
type Props =  {
	children: React.ReactElement[],
};

export default function OscarAppContextProvider(
	props: Props
): React.ReactElement {
	const [selectedTab, setSelectedTab] = useState<AppTabType>(AppTabType.legacy);
	const [activeUser, setActiveUser] = useState<string | null>(null);
	const [preferences, setPreferences] = useState<Preferences>({shortsAreSeparate: false});
	const [year, setYear] = useState<number>(2023);

	const contextValue = useMemo(() => {
		return {
				selectedTab,
				setSelectedTab,
				activeUser,
				setActiveUser,
				preferences,
				setPreferences,
				year,
				setYear,
			};
	}, [
		selectedTab,
		setSelectedTab,
		activeUser,
		setActiveUser,
		preferences,
		setPreferences,
		year,
		setYear,
	]);

	return (
		<OscarAppContext.Provider value={contextValue}>
			<CookieHandler />
			{props.children}
		</OscarAppContext.Provider>
	);
}

/*
//sample usage
const contextValue = useContext(OscarAppContext); //puts current context value into variable contextValue
// contextValue has type OscarAppContextValue
const activeUser = contextValue.activeUser
// activeUser has type string

// second example
const {activeUser}d = useContext(OscarAppContext); //faster way to just get activeUser
*/

function CookieHandler(): React.ReactElement {
	const { activeUser, setActiveUser} = useContext(OscarAppContext);
	const EXPIRATION_DAYS = 400;
	const [isInitialised, setIsInitialised] = useState(false);

	useEffect(() => {
		if (isInitialised) {
			Cookies.set('activeUser', activeUser, {expires: EXPIRATION_DAYS});
		} else {
			setIsInitialised(true);
			const value: string|undefined = Cookies.get('activeUser');
			if (value && value.startsWith('usr_')) {
				setActiveUser(value);
			} else {
				setActiveUser(null);
			}
		}

	}, [activeUser]);
	//useEffect(() => {Cookies.set('activeUser', activeUser, {expires: EXPIRATION_DAYS})}, [activeUser]);
	return <></>;
}