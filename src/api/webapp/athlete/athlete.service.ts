import { Injectable } from '@nestjs/common';

import { AthleteDetail } from 'core/athlete/entity/athlete-detail';
import { DatabaseService } from 'core/database/database.service';
import { AgeCategory, Discipline, DisciplineType, Gender, Year } from 'shared/enums';
import { DisciplineUtility } from 'shared/enums/enums-utility';
import { Utils } from 'shared/utils';
import { AthleteSuggestionsResponse } from './dto/athlete-suggestions.response';

@Injectable()
export class AthleteService {
  constructor(private readonly db: DatabaseService) {}

  public async getAthleteSuggestions(query: string, includeEmail: boolean): Promise<AthleteSuggestionsResponse> {
    const lookup = Utils.normalizeString(query);
    if (lookup.length < 3) {
      return new AthleteSuggestionsResponse([]);
    }
    const athletes = await this.db.queryAthletesByName(lookup, 5);
    return new AthleteSuggestionsResponse(
      athletes.map(athlete => {
        return {
          id: athlete.id,
          name: athlete.name,
          surname: athlete.surname,
          email: includeEmail ? athlete.email : undefined,
        };
      }),
    );
  }

  public async getAthlete(id: string): Promise<AthleteDetail> {
    const athlete = await this.db.getAthleteDetails(id);
    return athlete;
  }

  public async getOverallRank(id: string) {
    const pk = {
      ageCategory: AgeCategory.All,
      athleteId: id,
      discipline: Discipline.Overall,
      gender: Gender.All,
      year: Year.All,
    };
    const place = await this.db.getAthleteRankingPlace(pk);
    return place;
  }

  public async getContests(
    id: string,
    year: number,
    discipline: Discipline,
    after?: {
      contestId: string;
      discipline: Discipline;
      date: string;
    },
  ) {
    const filterDisciplines = [discipline, ...DisciplineUtility.getAllChildren(discipline)].filter(
      d => DisciplineUtility.getType(d) === DisciplineType.Competition,
    );
    const contests = await this.db.queryAthleteContestsByDate(id, 10, year, after, {
      disciplines: filterDisciplines,
    });
    return contests;
  }
}
