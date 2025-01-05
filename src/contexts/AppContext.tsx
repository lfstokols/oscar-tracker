import React, { useState, useMemo, useEffect, useContext } from "react";
import { AppTabType } from "../types/Enums";
import Cookies from "js-cookie";

export type OscarAppContextValue = Readonly<{
	selectedTab: AppTabType;
	setSelectedTab: (tab: AppTabType) => void;
	activeUserId: string | null;
	setActiveUserId: (username: string | null) => void;
	preferences: Preferences;
	setPreferences: (pref: Preferences) => void;
	year: number;
	setYear: (year: number) => void;
}>;

const DEFAULT_CONTEXT_VALUE: OscarAppContextValue = {
	selectedTab: AppTabType.legacy,
	setSelectedTab: (tab) => {},
	activeUserId: null,
	setActiveUserId: (username) => {},
	preferences: { shortsAreSeparate: false },
	setPreferences: (pref) => {},
	year: 2023,
	setYear: (year) => {},
};

export const OscarAppContext: React.Context<OscarAppContextValue> =
	React.createContext(DEFAULT_CONTEXT_VALUE);

type Props = {
	children: React.ReactElement;
};

export default function OscarAppContextProvider(
	props: Props
): React.ReactElement {
	const [selectedTab, setSelectedTab] = useState<AppTabType>(AppTabType.legacy);
	const [activeUserId, setActiveUserId] = useState<string | null>(null);
	const [preferences, setPreferences] = useState<Preferences>({
		shortsAreSeparate: false,
	});
	const [year, setYear] = useState<number>(2023);

	const contextValue = useMemo(() => {
		return {
			selectedTab,
			setSelectedTab,
			activeUserId,
			setActiveUserId,
			preferences,
			setPreferences,
			year,
			setYear,
		};
	}, [
		selectedTab,
		setSelectedTab,
		activeUserId,
		setActiveUserId,
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
const activeUserId = contextValue.activeUserId
// activeUserId has type string

// second example
const {activeUserId}d = useContext(OscarAppContext); //faster way to just get activeUserId
*/

function CookieHandler(): React.ReactElement {
	const { activeUserId, setActiveUserId } = useContext(OscarAppContext);
	const EXPIRATION_DAYS = 400;
	const [isInitialised, setIsInitialised] = useState(false);

	useEffect(() => {
		if (isInitialised) {
			Cookies.set("activeUserId", activeUserId as string, {
				expires: EXPIRATION_DAYS,
			});
		} else {
			setIsInitialised(true);
			const value: string | undefined = Cookies.get("activeUserId");
			if (value && value.startsWith("usr_")) {
				setActiveUserId(value);
			} else {
				setActiveUserId(null);
			}
		}
	}, [activeUserId]);
	//useEffect(() => {Cookies.set('activeUserId', activeUserId, {expires: EXPIRATION_DAYS})}, [activeUserId]);
	return <></>;
}
